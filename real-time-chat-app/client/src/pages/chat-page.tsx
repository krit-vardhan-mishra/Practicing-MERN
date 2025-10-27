import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { io, Socket } from "socket.io-client";
import { useLocation } from "wouter";
import Sidebar from "@/components/chat/sidebar";
import ChatArea from "@/components/chat/chat-area";
import LogoutDialog from "@/components/chat/logout-dialog";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import HelpSupportPage from "@/pages/help-support-page";
import { generateKeyPair, getKeys, storeKeys, encryptMessage, decryptMessageWithOtherPublic } from "@/lib/crypto";
import Message from "@/data/message";
import Conversation from "@/data/conversation";
import { useWebRTC } from "@/hooks/use-webrtc";
import CallPanel from "@/components/chat/call-panel";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [showHelpPage, setShowHelpPage] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userKeys, setUserKeys] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const publicKeyCache = useRef<Map<number, string>>(new Map());
  const conversationsRef = useRef<Conversation[]>([]);

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Keep conversations ref updated
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const { data: conversationMessages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
  });

  // Initialize encryption keys
  useEffect(() => {
    if (!user) return;

    let keys = getKeys();
    if (!keys) {
      // Generate new keys if they don't exist
      keys = generateKeyPair();
      storeKeys(keys.publicKey, keys.secretKey);
    }
    setUserKeys(keys);
  }, [user]);

  // Helper function to fetch and cache public keys (memoized to prevent recreating)
  const fetchPublicKey = useCallback(async (userId: number): Promise<string | null> => {
    // Check cache first
    if (publicKeyCache.current.has(userId)) {
      return publicKeyCache.current.get(userId)!;
    }

    try {
      const res = await fetch(`/api/users/${userId}/public-key`, {
        credentials: "include",
      });

      if (!res.ok) {
        console.error(`Failed to fetch public key for user ${userId}:`, res.status, res.statusText);
        return null;
      }

      const { publicKey } = await res.json();
      
      if (!publicKey) {
        console.error(`User ${userId} has no public key in database. They need to login again to generate keys.`);
        return null;
      }
      
      // Cache the public key
      publicKeyCache.current.set(userId, publicKey);
      
      return publicKey;
    } catch (error) {
      console.error("Error fetching public key:", error);
      return null;
    }
  }, []); // Empty dependency array - stable reference

  // Helper function to decrypt a message (memoized with stable dependencies)
  const decryptMessageContent = useCallback(async (message: Message): Promise<Message> => {
    if (!userKeys) return message;

    // Check if the message is already plain text (e.g., friendly error message)
    // If content doesn't start with '{' it's not JSON, return as-is
    if (!message.content.trim().startsWith('{')) {
      return message;
    }

    try {
      const parsed = JSON.parse(message.content);
      
      // If it doesn't have encrypted/nonce, it's already decrypted or plain text
      if (!parsed.encrypted || !parsed.nonce) {
        return message;
      }

  const { encrypted, nonce } = parsed;
      let decryptedContent: string;

      if (message.senderId === user?.id) {
        // Own message: decrypt using recipient's public key
        const conversation = conversationsRef.current.find(c => c.id === message.conversationId);
        const recipient = conversation?.participants.find((p) => p.id !== user?.id);
        
        if (!recipient) return message;
        
        const recipientPublicKey = await fetchPublicKey(recipient.id);
        if (!recipientPublicKey) {
          // Recipient has no public key uploaded — show friendly notice instead of the raw encrypted JSON
          const name = recipient.fullName || recipient.username || `User ${recipient.id}`;
          return { ...message, content: `${name} has no public key, user must login again` };
        }

        decryptedContent = decryptMessageWithOtherPublic(
          encrypted,
          nonce,
          recipientPublicKey,
          userKeys.secretKey
        );
      } else {
        // Other's message: decrypt using sender's public key
        const senderPublicKey = await fetchPublicKey(message.senderId);
        // Try to find sender information from the conversation participants for a friendly name
        const conversation = conversationsRef.current.find(c => c.id === message.conversationId);
        const sender = conversation?.participants.find((p) => p.id === message.senderId);

        if (!senderPublicKey) {
          const name = sender?.fullName || sender?.username || `User ${message.senderId}`;
          return { ...message, content: `${name} has no public key, user must login again` };
        }

        decryptedContent = decryptMessageWithOtherPublic(
          encrypted,
          nonce,
          senderPublicKey,
          userKeys.secretKey
        );
      }

      return { ...message, content: decryptedContent };
    } catch (error) {
      console.error("Failed to decrypt message:", error);
      // If JSON parsing fails or decryption fails, return original content
      // This handles cases where content is already plain text
      return message;
    }
  }, [userKeys?.publicKey, userKeys?.secretKey, user?.id, fetchPublicKey]); // Use stable primitive dependencies

  useEffect(() => {
    const decryptMessages = async () => {
      if (conversationMessages && userKeys) {
        // Decrypt messages in batches to prevent UI blocking
        const batchSize = 10;
        const decrypted: Message[] = [];
        
        for (let i = 0; i < conversationMessages.length; i += batchSize) {
          const batch = conversationMessages.slice(i, i + batchSize);
          const batchDecrypted = await Promise.all(
            batch.map(msg => decryptMessageContent(msg))
          );
          decrypted.push(...batchDecrypted);
          
          // Update UI incrementally for better perceived performance
          if (i === 0 || i + batchSize >= conversationMessages.length) {
            setMessages([...decrypted]);
          }
        }
        
        setHasMoreMessages(conversationMessages.length === 50);
      }
    };

    decryptMessages();
  }, [conversationMessages, userKeys?.publicKey, userKeys?.secretKey]); // Only depend on primitive values

  // WebRTC hook setup
  const {
    callState,
    localStream,
    remoteStream,
    startCall,
    acceptRinging,
    rejectCall,
    endCall,
  } = useWebRTC(socket, user?.id);

  // Socket.io setup
  useEffect(() => {
    if (!user || !userKeys) return;

    const newSocket = io({
      auth: { userId: user.id },
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket");
    });

    newSocket.on("new_message", async (message: Message) => {
      // Decrypt the message content if it's from another user
      if (message.senderId !== user.id && userKeys) {
        const senderPublicKey = await fetchPublicKey(message.senderId);
        // Try to resolve sender name for a friendly message if needed
        const conversation = conversationsRef.current.find(c => c.id === message.conversationId);
        const sender = conversation?.participants.find((p) => p.id === message.senderId);

        if (!senderPublicKey) {
          const name = sender?.fullName || sender?.username || `User ${message.senderId}`;
          message.content = `${name} has no public key, user must login again`;
        } else {
          try {
            // Parse the encrypted payload
            const { encrypted, nonce } = JSON.parse(message.content);

            const decryptedContent = decryptMessageWithOtherPublic(
              encrypted,
              nonce,
              senderPublicKey,
              userKeys.secretKey
            );
            message.content = decryptedContent;
          } catch (error) {
            console.error("Failed to decrypt message:", error);
            message.content = "[Encrypted message - decryption failed]";
          }
        }
      } else if (message.senderId === user.id && userKeys) {
        // For own messages, we need to decrypt them as well since they're encrypted
        try {
          const { encrypted, nonce } = JSON.parse(message.content);
          // Get conversation from current state via ref
          const conversation = conversationsRef.current.find(c => c.id === message.conversationId);
          const recipient = conversation?.participants.find((p) => p.id !== user.id);
          
          if (recipient) {
            const recipientPublicKey = await fetchPublicKey(recipient.id);
            if (!recipientPublicKey) {
              const name = recipient.fullName || recipient.username || `User ${recipient.id}`;
              message.content = `${name} has no public key, user must login again`;
            } else {
              // For own messages, decrypt using recipient's public key and own secret key
              const decryptedContent = decryptMessageWithOtherPublic(
                encrypted,
                nonce,
                recipientPublicKey,
                userKeys.secretKey
              );
              message.content = decryptedContent;
            }
          }
        } catch (error) {
          console.error("Failed to decrypt own message:", error);
          message.content = "[Encrypted message - decryption failed]";
        }
      }

      if (message.conversationId === selectedConversation) {
        setMessages((prev) => [...prev, message]);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    });

    newSocket.on("message_delivered", ({ messageId }: { messageId: number }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, delivered: true } : msg))
      );
    });

    newSocket.on("message_read", ({ messageId }: { messageId: number }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
      );
    });

    newSocket.on("user_online", ({ userId }: { userId: number }) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    });

    newSocket.on("user_offline", ({ userId }: { userId: number }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on("online_users", (userIds: number[]) => {
      setOnlineUsers(new Set(userIds));
    });

    setSocket(newSocket);

    return () => {
      // Clean up all event listeners before disconnecting
      newSocket.off("connect");
      newSocket.off("new_message");
      newSocket.off("message_delivered");
      newSocket.off("message_read");
      newSocket.off("user_online");
      newSocket.off("user_offline");
      newSocket.off("online_users");
      newSocket.disconnect();
    };
  }, [user?.id, userKeys?.publicKey, userKeys?.secretKey, selectedConversation, fetchPublicKey]); // Use primitive values only

  // Join conversation when selected
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    socket.emit("join_conversation", selectedConversation);

    return () => {
      socket.emit("leave_conversation", selectedConversation);
    };
  }, [socket, selectedConversation]);

  // Mark messages as read when conversation is selected and messages are visible
  useEffect(() => {
    if (!socket || !selectedConversation || messages.length === 0) return;

    // Find unread messages from other users
    const unreadMessages = messages.filter(
      (msg) => !msg.read && msg.senderId !== user?.id
    );

    // Mark each unread message as read
    unreadMessages.forEach((msg) => {
      socket.emit("mark_as_read", { messageId: msg.id });
    });
  }, [socket, selectedConversation, messages, user?.id]);

  const handleLoadMoreMessages = useCallback(async () => {
    if (!selectedConversation || isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    try {
      // Get the oldest message ID to use as the 'before' parameter
      const oldestMessageId = messages[0]?.id;
      if (!oldestMessageId) return;

      const res = await fetch(
        `/api/conversations/${selectedConversation}/messages?limit=50&before=${oldestMessageId}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error("Failed to load more messages");

      const olderMessages: Message[] = await res.json();
      
      if (olderMessages.length > 0) {
        // Decrypt the older messages in batches
        const batchSize = 10;
        const decryptedOlderMessages: Message[] = [];
        
        for (let i = 0; i < olderMessages.length; i += batchSize) {
          const batch = olderMessages.slice(i, i + batchSize);
          const batchDecrypted = await Promise.all(
            batch.map(msg => decryptMessageContent(msg))
          );
          decryptedOlderMessages.push(...batchDecrypted);
        }
        
        setMessages((prev) => [...decryptedOlderMessages, ...prev]);
        setHasMoreMessages(olderMessages.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedConversation, isLoadingMore, hasMoreMessages, messages, decryptMessageContent]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!socket || !selectedConversation || !content.trim() || !userKeys) return;

    try {
      // Get the recipient (other user in conversation) - use ref for conversations
      const conversation = conversationsRef.current.find(c => c.id === selectedConversation);
      if (!conversation) {
        console.error("Conversation not found");
        return;
      }

      const recipient = conversation.participants.find((p) => p.id !== user?.id);
      if (!recipient) {
        console.error("Recipient not found in conversation");
        return;
      }

      // Fetch recipient's public key
      const recipientPublicKey = await fetchPublicKey(recipient.id);
      if (!recipientPublicKey) {
        console.error(`Failed to fetch recipient public key for user ${recipient.id}. The recipient needs to login again to upload their public key.`);
        alert(`Cannot send message: The recipient needs to login again to generate encryption keys.`);
        return;
      }

      // Encrypt message using recipient's public key
      const { encrypted, nonce } = encryptMessage(
        content,
        recipientPublicKey,
        userKeys.secretKey
      );

      // Store encrypted message and nonce as JSON
      const encryptedPayload = JSON.stringify({ encrypted, nonce });

      socket.emit("send_message", {
        conversationId: selectedConversation,
        content: encryptedPayload,
      });
    } catch (error) {
      console.error("Error sending encrypted message:", error);
      alert("Failed to send message. Please try again.");
    }
  }, [socket, selectedConversation, userKeys?.publicKey, userKeys?.secretKey, user?.id, fetchPublicKey]); // Include conversations here since it's needed

  const handleCreateConversation = useCallback(async (userId: number) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create conversation");
      }

      const newConversation = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(newConversation.id);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  }, []);

  const handleLogoutClick = useCallback(() => {
    setShowLogoutDialog(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
      setLocation("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout, setLocation]);

  const handleLogoutCancel = useCallback(() => {
    setShowLogoutDialog(false);
  }, []);

  const handleProfileClick = useCallback(() => {
    setShowProfilePage(true);
  }, []);

  const handleProfileClose = useCallback(() => {
    setShowProfilePage(false);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setShowSettingsPage(true);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setShowSettingsPage(false);
  }, []);

  const handleHelpClick = useCallback(() => {
    setShowHelpPage(true);
  }, []);

  const handleHelpClose = useCallback(() => {
    setShowHelpPage(false);
  }, []);

  const handleBackToConversations = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const currentConversation =
    conversations.find((c) => c.id === selectedConversation) || null;

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-[#0D1117] text-[#C9D1D9]">
      {showLogoutDialog && (
        <LogoutDialog onConfirm={handleLogoutConfirm} onCancel={handleLogoutCancel} />
      )}

      {showProfilePage && (
        <ProfilePage onClose={handleProfileClose} />
      )}

      {showSettingsPage && (
        <SettingsPage onClose={handleSettingsClose} />
      )}

      {showHelpPage && (
        <HelpSupportPage onClose={handleHelpClose} />
      )}

      <Sidebar
        conversations={conversations}
        selectedId={selectedConversation}
        onSelect={setSelectedConversation}
        currentUser={user}
        onLogoutClick={handleLogoutClick}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
        onHelpClick={handleHelpClick}
        onCreateConversation={handleCreateConversation}
        isLoadingConversations={isLoadingConversations}
      />
      <ChatArea
        conversation={currentConversation}
        messages={messages}
        currentUserId={user.id}
        onSendMessage={handleSendMessage}
        onLoadMore={handleLoadMoreMessages}
        hasMore={hasMoreMessages}
        isLoadingMore={isLoadingMore}
        onBack={handleBackToConversations}
        showBackButton={!!selectedConversation}
        isLoadingMessages={isLoadingMessages}
        onlineUsers={onlineUsers}
        onStartVideoCall={(toUserId) => startCall(toUserId, { audio: true, video: true })}
        onStartAudioCall={(toUserId) => startCall(toUserId, { audio: true, video: false })}
      />

      {/* Call overlay */}
      <CallPanel
        visible={callState.status !== "idle"}
        callState={callState}
        otherUser={(() => {
          // Determine other user based on selected conversation or callState
          const peerId = (callState.status !== "idle" && "peerId" in callState) ? callState.peerId : undefined;
          if (!peerId) return null;
          // Try resolve name from conversations
          const foundConv = conversationsRef.current.find((c) => c.participants.some((p) => p.id === peerId));
          const userInfo = foundConv?.participants.find((p) => p.id === peerId);
          return userInfo ? { id: userInfo.id, name: userInfo.fullName || userInfo.username || `User ${userInfo.id}` } : { id: peerId, name: `User ${peerId}` };
        })()}
        localStreamRef={localStream}
        remoteStreamRef={remoteStream}
        onAccept={() => acceptRinging()}
        onReject={() => {
          if (callState.status === "ringing" && "peerId" in callState) {
            rejectCall(callState.peerId);
          }
        }}
        onEnd={() => {
          if (callState.status !== "idle" && "peerId" in callState) {
            endCall(callState.peerId);
          }
        }}
      />
    </div>
  );
}

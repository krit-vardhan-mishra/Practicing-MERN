import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Phone, Video, Smile, Paperclip, Mic, Send, Check, CheckCheck, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { io, Socket } from "socket.io-client";
import { useLocation } from "wouter";

// Types
interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  delivered: boolean;
  read: boolean;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    fullName?: string | null;
    avatar?: string | null;
  };
}

interface Conversation {
  id: number;
  name?: string | null;
  isGroup: boolean;
  createdAt: string;
  participants: Array<{
    id: number;
    username: string;
    fullName?: string | null;
    avatar?: string | null;
  }>;
  lastMessage?: Message | null;
}

// Custom GitHub Dark Mode Colors (approximate)
// Primary Background: #0D1117 (Image's deepest dark)
// Sidebar/Panel Background: #161B22 (Slightly lighter dark for contrast)
// Border/Divider: #30363D
// Text/Icon: #C9D1D9 (White/Light Gray)
// Accent/Primary Button (GitHub Green): #238636

// Logout Confirmation Dialog
const LogoutDialog = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161B22] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-[#30363D]">
        <h3 className="text-lg font-semibold text-[#C9D1D9] mb-4">
          Confirm Logout
        </h3>
        <p className="text-gray-400 mb-6">
          Are you sure you want to logout? You will need to login again to access your chats.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onCancel}
            variant="ghost"
            className="text-gray-400 hover:bg-[#30363D] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Yes, Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ conversations, selectedId, onSelect, currentUser, onLogoutClick }: {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  currentUser: { id: number; username: string; fullName?: string | null; avatar?: string | null };
  onLogoutClick: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="w-[400px] border-r border-[#30363D] flex flex-col bg-[#0D1117] h-screen">
      {/* Header */}
      <div className="p-3 bg-[#161B22] flex items-center justify-between border-b border-[#30363D]">
        <div className="flex-1">
          <h2 className="text-xl font-medium text-[#C9D1D9]">Chats</h2>
          <p className="text-xs text-gray-500">{currentUser.fullName || currentUser.username}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onLogoutClick}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-9 rounded-md"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Start a new conversation!</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const other = conv.participants.find(p => p.id !== currentUser.id);
            const displayName = conv.name || other?.fullName || other?.username || 'Unknown';
            const avatarText = displayName.substring(0, 2).toUpperCase();
            
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full p-3 text-left hover:bg-[#161B22] transition-colors flex items-center gap-3 border-b border-[#30363D] ${
                  selectedId === conv.id ? 'bg-[#161B22]' : '' // Highlight selected conversation
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-[#238636] text-white font-semibold text-sm"> {/* Using GitHub Green as avatar background */}
                    {avatarText}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-medium text-[#C9D1D9] truncate">{displayName}</h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-gray-400 truncate">{conv.lastMessage.content}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
};

// Chat Header Component
const ChatHeader = ({ conversation, currentUserId }: { conversation: Conversation; currentUserId: number }) => {
  const other = conversation.participants.find(p => p.id !== currentUserId);
  const displayName = conversation.name || other?.fullName || other?.username || 'Unknown';
  const avatarText = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="h-[60px] bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-[#238636] text-white font-semibold text-sm">
            {avatarText}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-[#C9D1D9]">{displayName}</h3>
          <p className="text-xs text-gray-500">online</p>
        </div>
      </div>
      <div className="flex gap-6">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]">
          <Video className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]">
          <Phone className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]">
          <Search className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwn }: { message: Message; isOwn: boolean }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[65%] rounded-lg px-3 py-2 ${
          isOwn
            ? 'bg-[#238636] text-white' // Using GitHub green for outgoing messages
            : 'bg-[#161B22] text-[#C9D1D9] border border-[#30363D]' // Sidebar/Panel dark for incoming
        }`}
      >
        <p className="text-[14.2px] leading-[19px] break-words">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1`}>
          <span className={`text-[11px] ${isOwn ? 'text-gray-200' : 'text-gray-400'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            <span className="text-gray-300">
              {message.read ? <CheckCheck className="w-4 h-4 text-blue-400" /> : <Check className="w-4 h-4" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Message Input Component
const MessageInput = ({ onSend }: { onSend: (message: string) => void }) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <div className="h-[62px] bg-[#161B22] border-t border-[#30363D] flex items-center gap-2 px-4">
      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]">
        <Smile className="w-6 h-6" />
      </Button>
      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]">
        <Paperclip className="w-6 h-6" />
      </Button>
      <Input
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        className="flex-1 bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md"
      />
      {message.trim() ? (
        <Button
          onClick={handleSend}
          size="icon"
          className="bg-[#238636] hover:bg-[#238636]/90 text-white rounded-full" // GitHub Green
        >
          <Send className="w-5 h-5" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]">
          <Mic className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

// Main Chat Area Component
const ChatArea = ({ conversation, messages, currentUserId, onSendMessage }: {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: number;
  onSendMessage: (message: string) => void;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D1117] text-gray-400">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-light text-[#C9D1D9] mb-2">Real-Time Chat</h2>
          <p className="text-sm">
            Select a conversation from the sidebar to start chatting
          </p>
          <p className="text-xs text-gray-500 mt-8">🔒 End-to-end encrypted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0D1117]">
      <ChatHeader conversation={conversation} currentUserId={currentUserId} />
      
      {/* Messages Area - Removed pattern for cleaner GitHub aesthetic */}
      <div 
        className="flex-1 overflow-y-auto px-[8%] py-4"
        style={{
          backgroundColor: '#0D1117'
        }}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={onSendMessage} />
    </div>
  );
};

// Main App Component
export default function ChatPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
  });

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io({
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      newSocket.emit("authenticate", user.id);
    });

    newSocket.on("new_message", (message: Message) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (message.conversationId === selectedConversation) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${selectedConversation}/messages`],
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, selectedConversation]);

  // Join conversation when selected
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    socket.emit("join_conversation", selectedConversation);

    return () => {
      socket.emit("leave_conversation", selectedConversation);
    };
  }, [socket, selectedConversation]);

  const handleSendMessage = (content: string) => {
    if (!socket || !selectedConversation || !content.trim()) return;

    socket.emit("send_message", {
      conversationId: selectedConversation,
      content,
    });
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
      setLocation("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation) || null;

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-[#0D1117] text-[#C9D1D9]">
      {showLogoutDialog && (
        <LogoutDialog onConfirm={handleLogoutConfirm} onCancel={handleLogoutCancel} />
      )}
      
      <Sidebar
        conversations={conversations}
        selectedId={selectedConversation}
        onSelect={setSelectedConversation}
        currentUser={user}
        onLogoutClick={handleLogoutClick}
      />
      <ChatArea
        conversation={currentConversation}
        messages={messages}
        currentUserId={user.id}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
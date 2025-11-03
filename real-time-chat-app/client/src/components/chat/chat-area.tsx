import { useState, useEffect } from "react";
import { genConfig } from "react-nice-avatar";
import SelectedUserProfile from "./selected-user-profile";
import Conversation from "@/data/conversation";
import Message from "@/data/message";
import ChatHeader from "./components/chat-header";
import ChatInput from "./components/chat-input";
import ChatMessageArea from "./components/chat-message-area";

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: number;
  onSendMessage: (content: string) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  isLoadingMessages?: boolean;
  onlineUsers?: Set<number>;
  onStartVideoCall?: (toUserId: number) => void;
  onStartAudioCall?: (toUserId: number) => void;
}

export default function ChatArea({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onBack,
  showBackButton = false,
  isLoadingMessages = false,
  onlineUsers = new Set(),
  onStartVideoCall,
  onStartAudioCall,
}: ChatAreaProps) {
  const [messageInput, setMessageInput] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [isMessageSearchMode, setIsMessageSearchMode] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");

  // Reset message search when conversation changes
  useEffect(() => {
    setIsMessageSearchMode(false);
    setMessageSearchQuery("");
  }, [conversation]);

  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput("");
    }
  };

  const handleToggleMessageSearch = () => {
    setIsMessageSearchMode(prev => {
      if (prev) {
        setMessageSearchQuery("");
      }
      return !prev;
    });
  };

  const handleClearMessageSearch = () => {
    setMessageSearchQuery("");
    setIsMessageSearchMode(false);
  }

  if (!conversation) {
    // This view is visible only on large screens when no conversation is selected (mobile hides the whole ChatArea div).
    return (
      <div className="flex items-center justify-center bg-[#0D1117] w-full h-full"> 
        <div className="text-center text-gray-500 px-4">
          <p className="text-base sm:text-lg">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const other = conversation.participants.find((p) => p.id !== currentUserId);
  const displayName = conversation.name || other?.fullName || other?.username || "Unknown";
  const avatarConfig = other?.avatar ? JSON.parse(other.avatar) : genConfig();
  const isOtherUserOnline = other ? onlineUsers.has(other.id) : false;

  return (
    <div className="flex-1 flex flex-col bg-[#0D1117] relative w-full h-full">
      <ChatHeader
        displayName={displayName}
        avatarConfig={avatarConfig}
        isOtherUserOnline={isOtherUserOnline}
        showBackButton={showBackButton}
        onBack={onBack}
        onStartVideoCall={onStartVideoCall}
        onStartAudioCall={onStartAudioCall}
        isMessageSearchMode={isMessageSearchMode}
        messageSearchQuery={messageSearchQuery}
        setMessageSearchQuery={setMessageSearchQuery}
        handleToggleMessageSearch={handleToggleMessageSearch}
        handleClearMessageSearch={handleClearMessageSearch}
        onProfileClick={() => setShowProfile(true)}
        userId={other?.id}
      />

      <ChatMessageArea
        messages={messages}
        currentUserId={currentUserId}
        isLoadingMore={isLoadingMore}
        isLoadingMessages={isLoadingMessages}
        messageSearchQuery={messageSearchQuery}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />

      <ChatInput
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        handleSend={handleSend}
      />

      {/* User Profile Overlay */}
      {showProfile && other && (
        <SelectedUserProfile userId={other.id} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
} 

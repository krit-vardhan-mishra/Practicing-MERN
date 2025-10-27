import { useState, useEffect, useRef } from "react";
import Avatar, { genConfig } from "react-nice-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  Send,
  Check,
  CheckCheck,
  Loader2,
  ArrowLeft,
  X, // Added X for clearing search
} from "lucide-react";
import Message from "@/data/message";
import Conversation from "@/data/conversation";
import SelectedUserProfile from "./selected-user-profile";

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
  // New states for message search UI
  const [isMessageSearchMode, setIsMessageSearchMode] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);

  // Auto-scroll to bottom on initial load or new messages (only if already at bottom)
  useEffect(() => {
    if (isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoad.current = false;
    } else {
      const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Reduced threshold for better responsiveness
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 20;
        if (isAtBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [messages]);

  // Handle scroll to top for loading more messages
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = async () => {
      if (scrollContainer.scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
        previousScrollHeight.current = scrollContainer.scrollHeight;
        await onLoadMore();
      }
    };

    if (conversation) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, onLoadMore, conversation]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (isLoadingMore) return;

    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer && previousScrollHeight.current > 0) {
      const newScrollHeight = scrollContainer.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      scrollContainer.scrollTop = scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [messages, isLoadingMore]);

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
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D1117]">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const other = conversation.participants.find((p) => p.id !== currentUserId);
  const displayName = conversation.name || other?.fullName || other?.username || "Unknown";
  const avatarConfig = other?.avatar ? JSON.parse(other.avatar) : genConfig();
  const isOtherUserOnline = other ? onlineUsers.has(other.id) : false;
  const filteredMessages = messages.filter(message =>
    !messageSearchQuery.trim() || message.content.toLowerCase().includes(messageSearchQuery.toLowerCase().trim())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0D1117] relative">
      {/* Chat Header */}
      <div
        className="h-[60px] bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-4 cursor-pointer"
        onClick={(e) => {
          // Only open profile if not clicking on action buttons
          const target = e.target as HTMLElement;
          if (!target.closest('button')) {
            setShowProfile(true);
          }
        }}
      >
        {/* Left side: Avatar and Name */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onBack?.();
              }}
              className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Avatar className="w-10 h-10 rounded-full" {...avatarConfig} />
          <div>
            <h3 className="font-medium text-[#C9D1D9]">{displayName}</h3>
            <p className={`text-xs ${isOtherUserOnline ? "text-green-500" : "text-red-500"}`}>
              {isOtherUserOnline ? "online" : "offline"}
            </p>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex gap-2">
          {/* Message Search Input (Conditionally rendered) */}
          {isMessageSearchMode && (
            <div className="relative flex items-center w-64 mr-2">
              <Input
                placeholder="Search messages..."
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                // IMPORTANT: Using primary green accent and rounded-lg for theme consistency
                className="w-full bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#238636] h-8 text-sm pl-3 pr-8 rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearMessageSearch();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9D1D9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search Button (Toggles search mode) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMessageSearch();
            }}
            className={`text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] ${isMessageSearchMode ? 'bg-[#30363D]' : ''}`}
            title={isMessageSearchMode ? "Close message search" : "Search messages"}
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Other action buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (other && onStartVideoCall) onStartVideoCall(other.id);
            }}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] hidden sm:flex"
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (other && onStartAudioCall) onStartAudioCall(other.id);
            }}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] hidden sm:flex"
            title="Voice Call"
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
            title="More Options"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-2" ref={scrollAreaRef}>
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
        {isLoadingMessages ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="flex items-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
              <span>Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          filteredMessages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            // Check if the message content matches the search query for highlighting
            const isSearchResult = messageSearchQuery.trim() && message.content.toLowerCase().includes(messageSearchQuery.toLowerCase().trim());

            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
                <div
                  className={`max-w-[65%] rounded-lg px-3 py-2 ${isOwn
                    ? "bg-[#238636] text-white"
                    : "bg-[#161B22] text-[#C9D1D9] border border-[#30363D]"
                    } ${isSearchResult ? 'ring-2 ring-yellow-400 shadow-md' : ''} transition-all duration-300`}
                >
                  <p className="text-[14.2px] leading-[19px] break-words">
                    {/* Basic highlighting for search results */}
                    {isSearchResult ? (
                      message.content.split(new RegExp(`(${messageSearchQuery})`, 'gi')).map((part, index) => (
                        <span key={index} className={part.toLowerCase() === messageSearchQuery.toLowerCase() ? 'bg-yellow-300 text-black rounded px-0.5' : ''}>
                          {part}
                        </span>
                      ))
                    ) : (
                      message.content
                    )}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[11px] ${isOwn ? "text-gray-200" : "text-gray-400"}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOwn && (
                      <span className="text-gray-300">
                        {message.read ? (
                          <CheckCheck className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Input */}
      <div className="h-[62px] bg-[#161B22] border-t border-[#30363D] flex items-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
          title="Emoji"
        >
          <Smile className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
          title="Attach File"
        >
          <Paperclip className="w-6 h-6" />
        </Button>
        <Input
          placeholder="Type a message"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          // IMPORTANT: Fixed to use primary green accent and rounded-lg
          className="flex-1 bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#238636] rounded-lg"
        />
        {messageInput.trim() ? (
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-[#238636] hover:bg-[#238636]/90 text-white rounded-full"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
            title="Record Voice Message"
          >
            <Mic className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* User Profile Overlay */}
      {showProfile && other && (
        <SelectedUserProfile userId={other.id} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}

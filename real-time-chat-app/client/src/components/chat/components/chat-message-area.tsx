import Message from "@/data/message";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Loader2, CheckCheck, Check } from "lucide-react";
import { useRef, useEffect } from "react";

interface ChatMessageAreaProps {
  messages: Message[];
  currentUserId: number;
  isLoadingMore?: boolean;
  isLoadingMessages?: boolean;
  messageSearchQuery: string;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
}

export default function ChatMessageArea({
  messages,
  currentUserId,
  isLoadingMore = false,
  isLoadingMessages = false,
  messageSearchQuery,
  hasMore = false,
  onLoadMore,
}: ChatMessageAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);

  // Auto-scroll to bottom on initial load or new messages
  useEffect(() => {
    if (isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoad.current = false;
    } else {
      const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
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

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, onLoadMore]);

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

  const filteredMessages = messages.filter(message =>
    !messageSearchQuery.trim() || message.content.toLowerCase().includes(messageSearchQuery.toLowerCase().trim())
  );

  return (
    // Responsive padding is maintained (px-2 sm:px-4)
    <ScrollArea className="flex-1 px-2 sm:px-4 py-2" ref={scrollAreaRef}>
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}
      {isLoadingMessages ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 px-4">
          <div className="flex items-center">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-sm sm:text-base">Loading messages...</span>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 px-4">
          <p className="text-sm sm:text-base text-center">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        filteredMessages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          const isSearchResult = messageSearchQuery.trim() && message.content.toLowerCase().includes(messageSearchQuery.toLowerCase().trim());

          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
              <div
                // Responsive width max-w-[85%] sm:max-w-[75%] md:max-w-[65%] is maintained
                className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-lg px-3 py-2 ${isOwn
                  ? "bg-[#238636] text-white"
                  : "bg-[#161B22] text-[#C9D1D9] border border-[#30363D]"
                  } ${isSearchResult ? 'ring-2 ring-yellow-400 shadow-md' : ''} transition-all duration-300`}
              >
                {/* Responsive text size is maintained */}
                <p className="text-[13px] sm:text-[14.2px] leading-[18px] sm:leading-[19px] break-words">
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
                  <span className={`text-[10px] sm:text-[11px] ${isOwn ? "text-gray-200" : "text-gray-400"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isOwn && (
                    <span className="text-gray-300">
                      {/* Responsive icon size is maintained */}
                      {message.read ? (
                        <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      ) : (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
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
  );
}

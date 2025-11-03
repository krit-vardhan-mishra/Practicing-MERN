
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Avatar, { genConfig } from "react-nice-avatar";
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  X,
} from "lucide-react";

interface ChatHeaderProps {
  displayName: string;
  avatarConfig: any;
  isOtherUserOnline: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  onStartVideoCall?: (userId: number) => void;
  onStartAudioCall?: (userId: number) => void;
  isMessageSearchMode: boolean;
  messageSearchQuery: string;
  setMessageSearchQuery: (query: string) => void;
  handleToggleMessageSearch: () => void;
  handleClearMessageSearch: () => void;
  onProfileClick: () => void;
  userId?: number;
}

export default function ChatHeader({
  displayName,
  avatarConfig,
  isOtherUserOnline,
  showBackButton,
  onBack,
  onStartVideoCall,
  onStartAudioCall,
  isMessageSearchMode,
  messageSearchQuery,
  setMessageSearchQuery,
  handleToggleMessageSearch,
  handleClearMessageSearch,
  onProfileClick,
  userId,
}: ChatHeaderProps) {
  return (
    <>
      <div
        className="min-h-[60px] bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-2 sm:px-4 py-2 cursor-pointer"
        onClick={onProfileClick} // Profile click handler on the header is maintained
      >
        {/* Left side: Avatar and Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {showBackButton && (
            // Back button is crucial for mobile responsiveness to close the chat and show the sidebar
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onBack?.();
              }}
              className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
              title="Back to conversations"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" {...avatarConfig} />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-[#C9D1D9] text-sm sm:text-base truncate">{displayName}</h3>
            <p className={`text-[10px] sm:text-xs ${isOtherUserOnline ? "text-green-500" : "text-red-500"}`}>
              {isOtherUserOnline ? "online" : "offline"}
            </p>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex gap-1 sm:gap-2 flex-shrink-0 items-center">
          {/* Mobile: Call dropdown (Phone icon) - hidden on sm and above */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="sm:hidden text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] h-8 w-8"
                title="Call options"
              >
                <Phone className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="bottom"
              className="w-40 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] shadow-lg"
              sideOffset={4}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (userId && onStartAudioCall) onStartAudioCall(userId);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#0D1117] focus:bg-[#0D1117] cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Audio call</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (userId && onStartVideoCall) onStartVideoCall(userId);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#0D1117] focus:bg-[#0D1117] cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Video call</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Message Search Input (Desktop) - Hidden below md */}
          {isMessageSearchMode && (
            <div className="relative hidden md:flex items-center w-48 lg:w-64 mr-2">
              <Input
                placeholder="Search messages..."
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="w-full bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#238636] h-8 text-sm pl-3 pr-8 rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearMessageSearch();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9D1D9]"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMessageSearch();
            }}
            className={`text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] h-8 w-8 sm:h-10 sm:w-10 ${isMessageSearchMode ? 'bg-[#30363D]' : ''}`}
            title={isMessageSearchMode ? "Close message search" : "Search messages"}
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Video Call Button - Hidden below sm */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (userId && onStartVideoCall) onStartVideoCall(userId);
            }}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] hidden sm:flex h-8 w-8 sm:h-10 sm:w-10"
            title="Video Call"
          >
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Audio Call Button - Hidden below sm */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (userId && onStartAudioCall) onStartAudioCall(userId);
            }}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] hidden sm:flex h-8 w-8 sm:h-10 sm:w-10"
            title="Voice Call"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* More Options Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] h-8 w-8 sm:h-10 sm:w-10"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Search Input (Below Header) - Hidden on md and above */}
      {isMessageSearchMode && (
        <div className="md:hidden bg-[#161B22] border-b border-[#30363D] px-3 py-2">
          <div className="relative flex items-center">
            <Input
              placeholder="Search messages..."
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#238636] h-9 text-sm pl-3 pr-8 rounded-lg"
            />
            <button
              onClick={handleClearMessageSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C9D1D9]"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

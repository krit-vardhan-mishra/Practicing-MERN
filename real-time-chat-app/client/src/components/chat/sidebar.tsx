import { useState, memo, useMemo, useCallback, useEffect } from "react";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import Avatar, { genConfig } from "react-nice-avatar";

import { useLazyQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useDebounce } from "@/hooks/use-debounce";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import HeaderMenu from "./header-menu";
import { Input } from "../ui/input";

const SEARCH_USERS = gql`
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id
      username
      fullName
      avatar
    }
  }
`;

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
  lastMessage?: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
  } | null;
}

interface User {
  id: number;
  username: string;
  fullName?: string | null;
  avatar?: string | null;
}

interface SidebarProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  currentUser: User;
  onLogoutClick: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
  onCreateConversation: (userId: number) => Promise<void>;
  isLoadingConversations?: boolean;
}

const Sidebar = memo(function Sidebar({
  conversations,
  selectedId,
  onSelect,
  currentUser,
  onLogoutClick,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onCreateConversation,
  isLoadingConversations,
}: SidebarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isDualSearchMode, setIsDualSearchMode] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const debouncedUserSearchQuery = useDebounce(userSearchQuery, 300);

  const [searchUsers, { loading, error, data }] = useLazyQuery<{
    searchUsers: Array<{
      id: number;
      username: string;
      fullName?: string | null;
      avatar?: string | null;
    }>;
  }>(SEARCH_USERS);

  useEffect(() => {
    if (debouncedUserSearchQuery && debouncedUserSearchQuery.length >= 2) {
      searchUsers({ variables: { query: debouncedUserSearchQuery } });
    }
  }, [debouncedUserSearchQuery, searchUsers]);

  const handleSearchClick = useCallback(() => {
    setIsSearchMode(true);
    setUserSearchQuery("");
  }, []);

  const handleDualSearchClick = useCallback(() => {
    setIsDualSearchMode(prev => !prev);
    if (!isDualSearchMode) {
      setUserSearchQuery("");
      setLocalSearchQuery("");
    }
  }, [isDualSearchMode]);

  const handleBackClick = useCallback(() => {
    setIsSearchMode(false);
    setUserSearchQuery("");
  }, []);

  const handleUserSelect = useCallback(async (userId: number) => {
    const existing = conversations.find(
      (conv) =>
        !conv.isGroup &&
        conv.participants.some((p) => p.id === userId) &&
        conv.participants.some((p) => p.id === currentUser.id)
    );

    if (existing) {
      onSelect(existing.id);
    } else {
      await onCreateConversation(userId);
    }

    setIsSearchMode(false);
    setIsDualSearchMode(false);
    setUserSearchQuery("");
    setLocalSearchQuery("");
  }, [onCreateConversation, conversations, currentUser.id, onSelect]);

  useEffect(() => {
    if (selectedId) {
      setIsSearchMode(false);
      setIsDualSearchMode(false);
      setUserSearchQuery("");
      setLocalSearchQuery("");
    }
  }, [selectedId]);

  const currentUserAvatarConfig = useMemo(() => {
    return currentUser.avatar ? JSON.parse(currentUser.avatar) : genConfig();
  }, [currentUser.avatar]);

  const dedupedConversations = useMemo(() => {
    const byOther = new Map<number, Conversation>();
    const groups: Conversation[] = [];

    const getWhen = (conv: Conversation) => new Date(conv.lastMessage?.createdAt || conv.createdAt).getTime();

    for (const conv of conversations) {
      if (conv.isGroup) {
        groups.push(conv);
        continue;
      }

      const other = conv.participants.find((p) => p.id !== currentUser.id);
      if (!other) continue;

      const existing = byOther.get(other.id);
      if (!existing) {
        byOther.set(other.id, conv);
      } else {
        const existingHasMsg = !!existing.lastMessage;
        const currentHasMsg = !!conv.lastMessage;
        const existingWhen = getWhen(existing);
        const currentWhen = getWhen(conv);

        const takeCurrent = currentHasMsg && !existingHasMsg
          ? true
          : (!currentHasMsg && existingHasMsg
            ? false
            : currentWhen >= existingWhen);
        if (takeCurrent) byOther.set(other.id, conv);
      }
    }

    return [...groups, ...Array.from(byOther.values())];
  }, [conversations, currentUser.id]);

  const filteredConversations = useMemo(() => {
    const base = dedupedConversations;
    if (!localSearchQuery.trim()) return base;
    return base.filter((conv) => {
      const other = conv.participants.find((p) => p.id !== currentUser.id);
      const displayName = conv.name || other?.fullName || other?.username || "";
      return displayName.toLowerCase().includes(localSearchQuery.toLowerCase());
    });
  }, [dedupedConversations, localSearchQuery, currentUser.id]);

  const searchResults = data?.searchUsers || [];

  return (
    // The parent div in chat-page.tsx handles the conditional width (w-full/fixed) and visibility (hidden/block)
    // This component now uses flex-1 and h-full to occupy the space it is given.
    <div className="flex-1 flex flex-col bg-[#0D1117] h-full">
      {/* Header */}
      <div className="p-2 sm:p-3 bg-[#161B22] flex items-center gap-2 sm:gap-3 border-b border-[#30363D]">
        {isSearchMode || isDualSearchMode ? (
          <button
            onClick={isSearchMode ? handleBackClick : handleDualSearchClick}
            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-[#30363D] transition-all cursor-pointer"
            title={isSearchMode ? "Back to chats" : "Back to chats"}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#C9D1D9]" />
          </button>
        ) : (
          <button
            onClick={onProfileClick}
            className="flex-shrink-0 rounded-full hover:ring-2 hover:ring-[#238636] transition-all cursor-pointer"
            title="Click to view profile"
          >
            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" {...currentUserAvatarConfig} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-medium text-[#C9D1D9] truncate">
            {isSearchMode ? "Search Users" : isDualSearchMode ? "Search & Filter" : "Chats"}
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
            {isSearchMode 
              ? "Find people to chat with" 
              : isDualSearchMode 
                ? "Search users and filter conversations"
                : (currentUser.fullName || currentUser.username)
            }
          </p>
        </div>
        {!isSearchMode && !isDualSearchMode && <HeaderMenu onLogout={onLogoutClick} onProfile={onProfileClick} onSettings={onSettingsClick} onHelp={onHelpClick} />}
      </div>

      {isSearchMode ? (
        <>
          {/* User Search Input */}
          <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              <Input
                placeholder="Search by username..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                autoFocus
                className="pl-8 sm:pl-10 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-8 sm:h-9 rounded-md text-sm"
              />
            </div>
          </div>

          {/* User Search Results */}
          <ScrollArea className="flex-1">
            {loading && (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400" />
              </div>
            )}

            {error && (
              <div className="flex justify-center items-center h-32 text-red-400 px-4">
                <p className="text-xs sm:text-sm text-center">Error: {error.message}</p>
              </div>
            )}

            {!loading && !error && userSearchQuery && searchResults.length === 0 && (
              <div className="flex justify-center items-center h-32 text-gray-500">
                <p className="text-xs sm:text-sm">No users found</p>
              </div>
            )}

            {!userSearchQuery && (
              <div className="flex justify-center items-center h-32 text-gray-500 px-4">
                <p className="text-xs sm:text-sm text-center">Start typing to search users...</p>
              </div>
            )}

            <div className="divide-y divide-[#30363D]">
              {searchResults.map((user) => (
                <UserSearchItem
                  key={user.id}
                  user={user}
                  onSelectUser={handleUserSelect}
                />
              ))}
            </div>
          </ScrollArea>
        </>
      ) : isDualSearchMode ? (
        <>
          {/* User Search Input */}
          <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-8 sm:h-9 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Conversation Filter Input */}
          <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              <Input
                placeholder="Filter conversations..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-8 sm:h-9 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Combined Results */}
          <ScrollArea className="flex-1">
            {userSearchQuery && (
              <div className="border-b border-[#30363D]">
                <h3 className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#C9D1D9] bg-[#161B22]">Users</h3>
                {loading && (
                  <div className="flex justify-center items-center h-16">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {error && (
                  <div className="flex justify-center items-center h-16 text-red-400 px-4">
                    <p className="text-xs text-center">Error: {error.message}</p>
                  </div>
                )}
                {!loading && !error && searchResults.length === 0 && (
                  <div className="flex justify-center items-center h-16 text-gray-500">
                    <p className="text-xs">No users found</p>
                  </div>
                )}
                <div className="divide-y divide-[#30363D]">
                  {searchResults.map((user) => (
                    <UserSearchItem
                      key={`user-${user.id}`}
                      user={user}
                      onSelectUser={handleUserSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Filtered Conversations */}
            <div>
              <h3 className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#C9D1D9] bg-[#161B22]">
                Conversations {localSearchQuery && `(${filteredConversations.length})`}
              </h3>
              {filteredConversations.length === 0 ? (
                <div className="flex justify-center items-center h-16 text-gray-500 px-4">
                  <p className="text-xs text-center">
                    {localSearchQuery ? "No conversations match your filter" : "No conversations"}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = conv.participants.find((p) => p.id !== currentUser.id);
                  const displayName = conv.name || other?.fullName || other?.username || "Unknown";
                  const avatarConfig = other?.avatar ? JSON.parse(other.avatar) : genConfig();

                  return (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      displayName={displayName}
                      avatarConfig={avatarConfig}
                      isSelected={selectedId === conv.id}
                      onSelect={onSelect}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          {/* Dual Search Toggle Button */}
          <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
            <button
              onClick={handleDualSearchClick}
              className={`w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#161B22] border border-[#30363D] rounded-md transition-colors ${
                isDualSearchMode 
                  ? 'text-[#C9D1D9] bg-[#30363D]' 
                  : 'text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]'
              }`}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Search & Filter</span>
            </button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {isLoadingConversations ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="text-sm sm:text-base">No conversations yet</p>
                <p className="text-xs sm:text-sm mt-2">Start a new conversation!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participants.find((p) => p.id !== currentUser.id);
                const displayName = conv.name || other?.fullName || other?.username || "Unknown";
                const avatarConfig = other?.avatar ? JSON.parse(other.avatar) : genConfig();

                return (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    displayName={displayName}
                    avatarConfig={avatarConfig}
                    isSelected={selectedId === conv.id}
                    onSelect={onSelect}
                  />
                );
              })
            )}
          </ScrollArea>
        </>
      )}
    </div>
  );
});

const ConversationItem = memo(function ConversationItem({
  conversation,
  displayName,
  avatarConfig,
  isSelected,
  onSelect,
}: {
  conversation: Conversation;
  displayName: string;
  avatarConfig: any;
  isSelected: boolean;
  onSelect: (id: number) => void;
}) {
  const getDisplayMessage = () => {
    if (!conversation.lastMessage?.content) return "";
    
    const content = conversation.lastMessage.content;
    
    if (content.includes("has no public key")) {
      return "🔒 Key required";
    }
    
    try {
      const parsed = JSON.parse(content);
      if (parsed.encrypted && parsed.nonce) {
        return "🔒 Encrypted message";
      }
      return content;
    } catch {
      // Use substring with a responsive fallback for truncation
      const maxLength = 50; 
      return content.length > maxLength ? content.substring(0, maxLength) + "..." : content;
    }
  };

  return (
    <button
      onClick={() => onSelect(conversation.id)}
      className={`w-full p-2 sm:p-3 text-left hover:bg-[#161B22] transition-colors flex items-center gap-2 sm:gap-3 border-b border-[#30363D] ${
        isSelected ? "bg-[#161B22]" : ""
      }`}
    >
      <Avatar className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0" {...avatarConfig} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5 sm:mb-1">
          <h3 className="font-medium text-sm sm:text-base text-[#C9D1D9] truncate">{displayName}</h3>
          {conversation.lastMessage && (
            <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0 ml-2">
              {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        {conversation.lastMessage && (
          <p className="text-xs sm:text-sm text-gray-400 truncate">{getDisplayMessage()}</p>
        )}
      </div>
    </button>
  );
});

const UserSearchItem = memo(function UserSearchItem({
  user,
  onSelectUser,
}: {
  user: {
    id: number;
    username: string;
    fullName?: string | null;
    avatar?: string | null;
  };
  onSelectUser: (userId: number) => Promise<void>;
}) {
  const avatarConfig = useMemo(() => {
    return user.avatar ? JSON.parse(user.avatar) : genConfig();
  }, [user.avatar]);

  return (
    <button
      onClick={() => onSelectUser(user.id)}
      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-[#161B22] transition-colors text-left"
    >
      <Avatar className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0" {...avatarConfig} />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm sm:text-base text-[#C9D1D9] truncate">
          {user.fullName || user.username}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-500 truncate">@{user.username}</p>
      </div>
    </button>
  );
});

export default Sidebar;

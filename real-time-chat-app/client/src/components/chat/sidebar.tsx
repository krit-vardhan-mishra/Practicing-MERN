import { useState, memo, useMemo, useCallback, useEffect } from "react";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import Avatar, { genConfig } from "react-nice-avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import HeaderMenu from "@/components/chat/header-menu";
import { useLazyQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useDebounce } from "@/hooks/use-debounce";

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

  // Trigger search when debounced query changes
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
      // When entering dual search mode, clear searches
      setUserSearchQuery("");
      setLocalSearchQuery("");
    }
  }, [isDualSearchMode]);

  const handleBackClick = useCallback(() => {
    setIsSearchMode(false);
    setUserSearchQuery("");
  }, []);

  const handleUserSelect = useCallback(async (userId: number) => {
    // If a 1:1 conversation with this user already exists, select it instead of creating a new one
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

    // Exit search mode and clear search after creating/selecting conversation
    setIsSearchMode(false);
    setIsDualSearchMode(false);
    setUserSearchQuery("");
    setLocalSearchQuery(""); // Also clear the local conversation filter
  }, [onCreateConversation, conversations, currentUser.id, onSelect]);

  // Reset search modes when a conversation is selected
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

  // Deduplicate 1:1 conversations by the other participant.
  // Keep only the most recent conversation (prefer one with a lastMessage).
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

        // Prefer conversations with a lastMessage; if both/none, take the newer one
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
    <div className="w-[400px] border-r border-[#30363D] flex flex-col bg-[#0D1117] h-screen">
      {/* Header */}
      <div className="p-3 bg-[#161B22] flex items-center gap-3 border-b border-[#30363D]">
        {isSearchMode || isDualSearchMode ? (
          // Back button in search modes
          <button
            onClick={isSearchMode ? handleBackClick : handleDualSearchClick}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#30363D] transition-all cursor-pointer"
            title={isSearchMode ? "Back to chats" : "Back to chats"}
          >
            <ArrowLeft className="w-5 h-5 text-[#C9D1D9]" />
          </button>
        ) : (
          // Profile avatar in normal mode
          <button
            onClick={onProfileClick}
            className="flex-shrink-0 rounded-full hover:ring-2 hover:ring-[#238636] transition-all cursor-pointer"
            title="Click to view profile"
          >
            <Avatar className="w-10 h-10 rounded-full" {...currentUserAvatarConfig} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-medium text-[#C9D1D9]">
            {isSearchMode ? "Search Users" : isDualSearchMode ? "Search & Filter" : "Chats"}
          </h2>
          <p className="text-xs text-gray-500 truncate">
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
        // User Search Mode
        <>
          {/* User Search Input */}
          <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by username..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                autoFocus
                className="pl-10 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-9 rounded-md"
              />
            </div>
          </div>

          {/* User Search Results */}
          <ScrollArea className="flex-1">
            {loading && (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}

            {error && (
              <div className="flex justify-center items-center h-32 text-red-400">
                <p className="text-sm px-4">Error: {error.message}</p>
              </div>
            )}

            {!loading && !error && userSearchQuery && searchResults.length === 0 && (
              <div className="flex justify-center items-center h-32 text-gray-500">
                <p className="text-sm">No users found</p>
              </div>
            )}

            {!userSearchQuery && (
              <div className="flex justify-center items-center h-32 text-gray-500">
                <p className="text-sm px-4 text-center">Start typing to search users...</p>
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
        // Dual Search Mode - Both user and conversation search
        <>
          {/* User Search Input */}
          <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-10 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-9 rounded-md"
              />
            </div>
          </div>

          {/* Conversation Filter Input */}
          <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Filter conversations..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10 bg-[#161B22] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-9 rounded-md"
              />
            </div>
          </div>

          {/* Combined Results */}
          <ScrollArea className="flex-1">
            {/* User Search Results */}
            {userSearchQuery && (
              <div className="border-b border-[#30363D]">
                <h3 className="px-3 py-2 text-sm font-medium text-[#C9D1D9] bg-[#161B22]">Users</h3>
                {loading && (
                  <div className="flex justify-center items-center h-16">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {error && (
                  <div className="flex justify-center items-center h-16 text-red-400">
                    <p className="text-xs px-4">Error: {error.message}</p>
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
              <h3 className="px-3 py-2 text-sm font-medium text-[#C9D1D9] bg-[#161B22]">
                Conversations {localSearchQuery && `(${filteredConversations.length})`}
              </h3>
              {filteredConversations.length === 0 ? (
                <div className="flex justify-center items-center h-16 text-gray-500">
                  <p className="text-xs">
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
        // Normal Conversations Mode
        <>
          {/* Dual Search Toggle Button */}
          <div className="p-2 bg-[#0D1117] border-b border-[#30363D]">
            <button
              onClick={handleDualSearchClick}
              className={`w-full flex items-center gap-2 px-3 py-2 bg-[#161B22] border border-[#30363D] rounded-md transition-colors ${
                isDualSearchMode 
                  ? 'text-[#C9D1D9] bg-[#30363D]' 
                  : 'text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search & Filter</span>
            </button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {isLoadingConversations ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start a new conversation!</p>
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

// Memoized conversation item to prevent unnecessary re-renders
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
  // Try to decrypt last message if it's encrypted
  const getDisplayMessage = () => {
    if (!conversation.lastMessage?.content) return "";
    
    const content = conversation.lastMessage.content;
    
    // Check if it's a friendly error message (e.g., "User X has no public key...")
    if (content.includes("has no public key")) {
      return "🔒 Key required";
    }
    
    try {
      // Check if message is encrypted (JSON format with encrypted and nonce)
      const parsed = JSON.parse(content);
      if (parsed.encrypted && parsed.nonce) {
        // If encrypted, show placeholder instead of raw JSON
        return "🔒 Encrypted message";
      }
      // If it's JSON but not encrypted format, return the original
      return content;
    } catch {
      // If not JSON, it's plain text (or already decrypted)
      // Truncate long messages
      return content.length > 50 ? content.substring(0, 50) + "..." : content;
    }
  };

  return (
    <button
      onClick={() => onSelect(conversation.id)}
      className={`w-full p-3 text-left hover:bg-[#161B22] transition-colors flex items-center gap-3 border-b border-[#30363D] ${
        isSelected ? "bg-[#161B22]" : ""
      }`}
    >
      <Avatar className="w-10 h-10 rounded-full flex-shrink-0" {...avatarConfig} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-medium text-[#C9D1D9] truncate">{displayName}</h3>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        {conversation.lastMessage && (
          <p className="text-sm text-gray-400 truncate">{getDisplayMessage()}</p>
        )}
      </div>
    </button>
  );
});

// Memoized user search item
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
      className="w-full flex items-center gap-3 p-3 hover:bg-[#161B22] transition-colors text-left"
    >
      <Avatar className="w-10 h-10 rounded-full flex-shrink-0" {...avatarConfig} />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[#C9D1D9] truncate">
          {user.fullName || user.username}
        </h3>
        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
      </div>
    </button>
  );
});

export default Sidebar;

import { useState, useEffect, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import Avatar, { genConfig } from "react-nice-avatar";
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

interface User {
  id: number;
  username: string;
  fullName?: string | null;
  avatar?: string | null;
}

interface UserSearchDialogProps {
  onBack: () => void;
  onSelectUser: (userId: number) => Promise<void>;
}

const UserSearchDialog = memo(function UserSearchDialog({ onBack, onSelectUser }: UserSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Reduced from 3000ms to 300ms

  const [searchUsers, { loading, error, data }] = useLazyQuery<{
    searchUsers: User[];
  }>(SEARCH_USERS);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
      searchUsers({ variables: { query: debouncedSearchQuery } });
    }
  }, [debouncedSearchQuery, searchUsers]);

  const handleUserClick = async (userId: number) => {
    await onSelectUser(userId);
  };

  const users = data?.searchUsers || [];

  return (
    <div className="flex-1 flex flex-col bg-[#0D1117]">
      {/* Header */}
      <div className="h-[60px] bg-[#161B22] border-b border-[#30363D] flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-medium text-[#C9D1D9]">Search Users</h2>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-[#0D1117] border-b border-[#30363D]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#161B22] border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="flex justify-center items-center h-32 text-red-400">
            <p>Error: {error.message}</p>
          </div>
        )}

        {!loading && !error && searchQuery && users.length === 0 && (
          <div className="flex justify-center items-center h-32 text-gray-500">
            <p>No users found</p>
          </div>
        )}

        {!searchQuery && (
          <div className="flex justify-center items-center h-32 text-gray-500">
            <p>Start typing to search users...</p>
          </div>
        )}

        <div className="divide-y divide-[#30363D]">
          {users.map((user: User) => (
            <UserSearchItem
              key={user.id}
              user={user}
              onSelectUser={handleUserClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// Memoized user search item to prevent unnecessary re-renders
const UserSearchItem = memo(function UserSearchItem({
  user,
  onSelectUser,
}: {
  user: User;
  onSelectUser: (userId: number) => Promise<void>;
}) {
  const avatarConfig = useMemo(() => {
    return user.avatar ? JSON.parse(user.avatar) : genConfig();
  }, [user.avatar]);

  return (
    <button
      onClick={() => onSelectUser(user.id)}
      className="w-full flex items-center gap-3 p-4 hover:bg-[#161B22] transition-colors text-left"
    >
      <Avatar className="w-12 h-12 rounded-full" {...avatarConfig} />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[#C9D1D9] truncate">
          {user.fullName || user.username}
        </h3>
        <p className="text-sm text-gray-500 truncate">@{user.username}</p>
      </div>
    </button>
  );
});

export default UserSearchDialog;

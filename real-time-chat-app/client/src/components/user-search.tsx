import { useState, useEffect } from "react";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import Avatar from "react-nice-avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
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
  fullName?: string;
  email?: string;
  avatar?: string;
}

interface SearchUsersData {
  searchUsers: User[];
}

interface UserSearchProps {
  onSelectUser?: (user: User) => void;
  onStartConversation?: (userId: number) => void;
}

export default function UserSearch({ onSelectUser, onStartConversation }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [searchUsers, { data, loading, error }] = useLazyQuery<SearchUsersData>(SEARCH_USERS, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (error) {
      console.error("GraphQL search error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      searchUsers({ variables: { query: debouncedSearchQuery.trim() } });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedSearchQuery, searchUsers]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectUser = (user: User) => {
    if (onSelectUser) {
      onSelectUser(user);
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleStartConversation = async (userId: number) => {
    if (onStartConversation) {
      await onStartConversation(userId);
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClose = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search users by username..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery.trim().length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10 bg-[#161B22] border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#238636] h-10"
        />
        {searchQuery && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#161B22] border border-[#30363D] rounded-lg shadow-xl z-50 max-h-[400px] overflow-hidden">
          {loading && (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#238636] mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-400">
              <p className="text-sm">Error: {error.message}</p>
            </div>
          )}

          {!loading && !error && data?.searchUsers && (
            <>
              {data.searchUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <p className="text-sm">No users found matching "{searchQuery}"</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="p-1">
                    {data.searchUsers.map((user: User) => {
                      const displayName = user.fullName || user.username;
                      
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleStartConversation(user.id)}
                          className="w-full p-2.5 hover:bg-[#0D1117] rounded-lg transition-colors flex items-center gap-3"
                        >
                          <div className="flex-shrink-0">
                            <Avatar 
                              className="w-11 h-11 rounded-full"
                              {...(user.avatar ? JSON.parse(user.avatar) : { 
                                sex: "man",
                                faceColor: "#AC6651",
                                earSize: "small",
                                hairColor: "#000",
                                hairStyle: "normal",
                                hatColor: "#000",
                                glassesStyle: "none",
                                noseStyle: "short",
                                mouthStyle: "smile",
                                shirtStyle: "hoody",
                                shirtColor: "#238636",
                                bgColor: "#161B22"
                              })}
                            />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-[#C9D1D9] truncate text-sm">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              @{user.username}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
      )}
    </div>
  );
}

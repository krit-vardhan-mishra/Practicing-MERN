import Avatar, { genConfig } from "react-nice-avatar";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

const GET_USER = gql`
  query GetUser($id: Int!) {
    getUser(id: $id) {
      id
      username
      fullName
      email
      avatar
    }
  }
`;

type UserLike = {
  id: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
  avatar?: string | null;
};

export default function SelectedUserProfile({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const [getUser, { data, loading, error }] = useLazyQuery<{
    getUser: UserLike;
  }>(GET_USER);

  useEffect(() => {
    getUser({ variables: { id: userId } });
  }, [userId, getUser]);

  if (loading) {
    return (
      <div className="absolute inset-0 z-50 bg-[#0D1117]/95 backdrop-blur-sm flex items-center justify-center">
        <div className="w-full max-w-md bg-[#161B22] border border-[#30363D] rounded-lg p-6 shadow-xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238636]"></div>
            <span className="ml-2 text-[#C9D1D9]">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.getUser) {
    return (
      <div className="absolute inset-0 z-50 bg-[#0D1117]/95 backdrop-blur-sm flex items-center justify-center">
        <div className="w-full max-w-md bg-[#161B22] border border-[#30363D] rounded-lg p-6 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <p className="text-red-400 mb-4">Failed to load user details</p>
            <Button onClick={onClose} variant="outline" className="text-black hover:text-scale-105">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const user = data.getUser;
  const avatarConfig = user.avatar ? JSON.parse(user.avatar) : genConfig();
  const displayName = user.fullName || user.username || "Unknown";

  return (
    <div className="absolute inset-0 z-50 bg-[#0D1117]/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-md bg-[#161B22] border border-[#30363D] rounded-lg p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 rounded-full mb-4" {...avatarConfig} />
          <h2 className="text-2xl font-semibold text-[#C9D1D9]">{displayName}</h2>
          <p className="text-sm text-gray-400">@{user.username}</p>
        </div>

        <div className="mt-6 space-y-3">
          <Row label="Full name" value={user.fullName || "Not provided"} />
          <Row label="Username" value={`@${user.username}`} />
          <Row label="Email" value={user.email || "Not available"} />
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline" className="text-black hover:text-scale-105">Close</Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-[#C9D1D9] ml-4 truncate max-w-[60%]">{value}</span>
    </div>
  );
}
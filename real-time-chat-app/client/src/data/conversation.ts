import Message from "./message";

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

export default Conversation;
interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  delivered: boolean;
  read: boolean;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    fullName?: string | null;
    avatar?: string | null;
  };
}

export default Message;
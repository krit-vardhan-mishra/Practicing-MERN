
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Paperclip, Send, Mic } from "lucide-react";

interface ChatInputProps {
  messageInput: string;
  setMessageInput: (input: string) => void;
  handleSend: () => void;
}

export default function ChatInput({
  messageInput,
  setMessageInput,
  handleSend,
}: ChatInputProps) {
  return (
    // Responsive padding and minimum height is maintained
    <div className="min-h-[56px] sm:min-h-[62px] bg-[#161B22] border-t border-[#30363D] flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2">
      <Button
        variant="ghost"
        size="icon"
        // Hidden on extra small screens (xs) to save space
        className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 hidden xs:flex"
        title="Emoji"
      >
        <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        // Hidden on extra small screens (xs) to save space
        className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 hidden xs:flex"
        title="Attach File"
      >
        <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>
      <Input
        placeholder="Type a message"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSend()}
        // flex-1 ensures the input takes up maximum available width
        className="flex-1 bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-[#238636] rounded-lg h-9 sm:h-10 text-sm sm:text-base"
      />
      {messageInput.trim() ? (
        <Button
          onClick={handleSend}
          size="icon"
          className="bg-[#238636] hover:bg-[#238636]/90 text-white rounded-full h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          title="Send Message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          title="Record Voice Message"
        >
          <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { MessageSquareOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#161B22] rounded-full mb-6 border border-[#30363D]">
          <MessageSquareOff className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-6xl font-bold text-[#C9D1D9] mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-2">Page not found</p>
        <p className="text-sm text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/">
          <Button className="bg-[#238636] hover:bg-[#238636]/90 text-white px-8">
            Go Home
          </Button>
        </a>
      </div>
    </div>
  );
}

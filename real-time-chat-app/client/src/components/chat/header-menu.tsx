import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, LogOut, Settings, User, HelpCircle } from "lucide-react";

interface HeaderMenuProps {
  onLogout: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}

export default function HeaderMenu({ onLogout, onProfile, onSettings, onHelp }: HeaderMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-[#161B22] border-[#30363D] text-[#C9D1D9]"
      >
        <DropdownMenuItem 
          onClick={onProfile}
          className="cursor-pointer hover:bg-[#0D1117] focus:bg-[#0D1117] focus:text-[#C9D1D9]"
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onSettings}
          className="cursor-pointer hover:bg-[#0D1117] focus:bg-[#0D1117] focus:text-[#C9D1D9]"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onHelp}
          className="cursor-pointer hover:bg-[#0D1117] focus:bg-[#0D1117] focus:text-[#C9D1D9]"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help & Support
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#30363D]" />
        <DropdownMenuItem 
          onClick={onLogout}
          className="cursor-pointer hover:bg-red-900/20 focus:bg-red-900/20 focus:text-red-400 text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

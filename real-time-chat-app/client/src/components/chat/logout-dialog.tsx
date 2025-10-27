import { Button } from "@/components/ui/button";

interface LogoutDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutDialog({ onConfirm, onCancel }: LogoutDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161B22] rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-[#30363D]">
        <h3 className="text-lg font-semibold text-[#C9D1D9] mb-4">
          Confirm Logout
        </h3>
        <p className="text-gray-400 mb-6">
          Are you sure you want to logout? You will need to login again to access your chats.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onCancel}
            variant="ghost"
            className="text-gray-400 hover:bg-[#30363D] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Yes, Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

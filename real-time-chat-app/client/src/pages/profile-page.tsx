import { useState, useEffect, memo, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Avatar, { genConfig } from "react-nice-avatar";
import { X, Camera } from "lucide-react";
import AvatarEditor from "@/components/avatar-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfilePageProps {
  onClose: () => void;
}

const ProfilePage = memo(function ProfilePage({ onClose }: ProfilePageProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    gender: "",
    avatar: "",
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        fullName: user.fullName || "",
        email: user.email || "",
        gender: user.gender || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarSave = (avatarConfig: string) => {
    setFormData((prev) => ({ ...prev, avatar: avatarConfig }));
    setShowAvatarPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await res.json();
      setMessage("Profile updated successfully!");

      // Update local user data
      window.location.reload(); // Reload to refresh auth context
    } catch (error: any) {
      setMessage(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const avatarConfig = useMemo(() => {
    if (formData.avatar) {
      try {
        return JSON.parse(formData.avatar);
      } catch {
        return genConfig();
      }
    }
    if (formData.gender) {
      return genConfig({ sex: formData.gender === "male" ? "man" : "woman" });
    }
    return genConfig();
  }, [formData.avatar, formData.gender]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#30363D]">
          <h2 className="text-2xl font-semibold text-[#C9D1D9]">Profile Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
              <Avatar
                className="w-32 h-32 hover:border-2 hover:border-white transition duration-150"
                {...avatarConfig}
              />
            </div>
            <Button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              variant="outline"
              className="border-[#30363D] text-[#1a1b1c] hover:bg-[#30363D] hover:text-[#C9D1D9]"
            >
              Change Avatar
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-[#C9D1D9]">
                Username
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9]"
                required
              />
            </div>

            <div>
              <Label htmlFor="fullName" className="text-[#C9D1D9]">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9]"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-[#C9D1D9]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9]"
              />
            </div>

            <div>
              <Label htmlFor="gender" className="text-[#C9D1D9]">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
              >
                <SelectTrigger className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9]">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-[#161B22] border-[#30363D]">
                  <SelectItem value="male" className="text-[#C9D1D9]">
                    Male
                  </SelectItem>
                  <SelectItem value="female" className="text-[#C9D1D9]">
                    Female
                  </SelectItem>
                  <SelectItem value="other" className="text-[#C9D1D9]">
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-md ${message.includes("success")
                  ? "bg-[#238636]/20 text-[#238636]"
                  : "bg-red-500/20 text-red-400"
                }`}
            >
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-[#30363D] text-[#2b2d2f] hover:text-[#C9D1D9] hover:bg-[#30363D]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#238636] hover:bg-[#238636]/90 text-white"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {showAvatarPicker && (
        <AvatarEditor
          initialConfig={formData.avatar}
          onSave={handleAvatarSave}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
});

export default ProfilePage;

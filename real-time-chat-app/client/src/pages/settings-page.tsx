import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Bell, Shield, Palette } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface SettingsPageProps {
  onClose: () => void;
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    gender: user?.gender || "",
    avatar: user?.avatar || "",
    notifications: {
      messageNotifications: true,
      callNotifications: true,
      soundEnabled: true,
    },
    privacy: {
      showOnlineStatus: true,
      allowMessageRequests: true,
    },
    appearance: {
      theme: "dark",
      messageDensity: "comfortable",
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    enabled: !!user,
  });

  const handleSave = async () => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: settings.username,
          fullName: settings.fullName,
          email: settings.email,
          gender: settings.gender,
          avatar: settings.avatar,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0D1117] border border-[#30363D] rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-[60px] bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-[#C9D1D9]">Settings</h2>
          </div>
          <Button onClick={handleSave} className="bg-[#238636] hover:bg-[#238636]/90">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">

          {/* Notifications */}
          <div>
            <h3 className="text-lg font-medium text-[#C9D1D9] mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C9D1D9]">Message Notifications</Label>
                  <p className="text-sm text-gray-400">Get notified when you receive new messages</p>
                </div>
                <Switch
                  checked={settings.notifications.messageNotifications}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, messageNotifications: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C9D1D9]">Call Notifications</Label>
                  <p className="text-sm text-gray-400">Get notified when someone calls you</p>
                </div>
                <Switch
                  checked={settings.notifications.callNotifications}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, callNotifications: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C9D1D9]">Sound Effects</Label>
                  <p className="text-sm text-gray-400">Play sounds for notifications and calls</p>
                </div>
                <Switch
                  checked={settings.notifications.soundEnabled}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, soundEnabled: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#30363D]" />

          {/* Privacy */}
          <div>
            <h3 className="text-lg font-medium text-[#C9D1D9] mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Privacy
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C9D1D9]">Show Online Status</Label>
                  <p className="text-sm text-gray-400">Let others see when you're online</p>
                </div>
                <Switch
                  checked={settings.privacy.showOnlineStatus}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, showOnlineStatus: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#C9D1D9]">Allow Message Requests</Label>
                  <p className="text-sm text-gray-400">Allow others to send you message requests</p>
                </div>
                <Switch
                  checked={settings.privacy.allowMessageRequests}
                  onCheckedChange={(checked: boolean) =>
                    setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, allowMessageRequests: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[#30363D]" />

          {/* Appearance */}
          <div>
            <h3 className="text-lg font-medium text-[#C9D1D9] mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-[#C9D1D9]">Theme</Label>
                <Select
                  value={settings.appearance.theme}
                  onValueChange={(value) =>
                    setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: value }
                    }))
                  }
                >
                  <SelectTrigger className="bg-[#161B22] border-[#30363D] text-[#C9D1D9] focus:ring-[#238636]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B22] border-[#30363D]">
                    <SelectItem value="dark" className="text-[#C9D1D9] focus:bg-[#C9D1D9]">Dark</SelectItem>
                    <SelectItem value="light" className="text-[#C9D1D9] focus:bg-[#C9D1D9]">Light</SelectItem>
                    <SelectItem value="system" className="text-[#C9D1D9] focus:bg-[#C9D1D9]">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#C9D1D9]">Message Density</Label>
                <Select
                  value={settings.appearance.messageDensity}
                  onValueChange={(value) =>
                    setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, messageDensity: value }
                    }))
                  }
                >
                  <SelectTrigger className="bg-[#161B22] border-[#30363D] text-[#C9D1D9] focus:ring-[#238636]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161B22] border-[#30363D]">
                    <SelectItem value="compact" className="text-[#C9D1D9] focus:bg-[#C9D1D9]">Compact</SelectItem>
                    <SelectItem value="comfortable" className="text-[#C9D1D9] focus:bg-[#C9D1D9]">Comfortable</SelectItem>
                    <SelectItem value="spacious" className="text-[#C9D1D9] focus:bg-[#C9D1D9]">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, memo, useCallback } from "react";
import Avatar, { genConfig } from "react-nice-avatar";
import { Button } from "@/components/ui/button";
import { X, Shuffle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AvatarEditorProps {
  onSave: (avatarConfig: string) => void;
  onClose: () => void;
  initialConfig?: string;
}

const AvatarEditor = memo(function AvatarEditor({ onSave, onClose, initialConfig }: AvatarEditorProps) {
  const [config, setConfig] = useState(() => {
    if (initialConfig) {
      try {
        return JSON.parse(initialConfig);
      } catch {
        return genConfig();
      }
    }
    return genConfig();
  });

  const handleRandomize = useCallback(() => {
    const newConfig = genConfig();
    setConfig(newConfig);
  }, []);

  const handleStyleChange = useCallback((key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(JSON.stringify(config));
    onClose();
  }, [config, onSave, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[90vh] bg-[#161B22] rounded-xl shadow-2xl border border-[#30363D] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363D]">
          <div>
            <h2 className="text-xl font-semibold text-[#C9D1D9]">Create Your Avatar</h2>
            <p className="text-xs text-[#8B949E] mt-1">Customize every detail to make it uniquely yours</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D] transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Avatar Preview (Fixed) */}
          <div className="w-80 p-6 border-r border-[#30363D] flex flex-col items-center justify-start bg-[#0D1117]/50">
            <div className="flex flex-col items-center space-y-6 sticky top-0">
              <div className="relative">
                <Avatar className="w-44 h-44 rounded-full ring-4 ring-[#30363D] shadow-2xl" {...config} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#238636]/10 to-transparent pointer-events-none"></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-[#C9D1D9]">Your Avatar</h3>
                <p className="text-xs text-[#8B949E]">Preview updates in real-time</p>
              </div>
              <Button
                type="button"
                onClick={handleRandomize}
                variant="outline"
                size="sm"
                className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9] hover:bg-[#238636] hover:border-[#238636] hover:text-white transition-all w-full"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Randomize
              </Button>
            </div>
          </div>

          {/* Right Side - Configuration Options (Scrollable) */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <div className="space-y-6">
                {/* Appearance */}
                <div>
                  <h4 className="text-sm font-semibold text-[#C9D1D9] mb-4 pb-2 border-b border-[#30363D]">Appearance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Gender</label>
                      <select
                        value={config.sex || "man"}
                        onChange={(e) => handleStyleChange("sex", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="man">Man</option>
                        <option value="woman">Woman</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Skin Tone</label>
                      <select
                        value={config.faceColor || "#F9C9B6"}
                        onChange={(e) => handleStyleChange("faceColor", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="#F9C9B6">Light</option>
                        <option value="#E0AC69">Medium Light</option>
                        <option value="#C68642">Medium</option>
                        <option value="#8D5524">Medium Dark</option>
                        <option value="#5C4033">Dark</option>
                        <option value="#3D2817">Very Dark</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Ear Size</label>
                      <select
                        value={config.earSize || "small"}
                        onChange={(e) => handleStyleChange("earSize", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="small">Small</option>
                        <option value="big">Big</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hair */}
                <div>
                  <h4 className="text-sm font-semibold text-[#C9D1D9] mb-4 pb-2 border-b border-[#30363D]">Hair</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Hair Style</label>
                      <select
                        value={config.hairStyle || "normal"}
                        onChange={(e) => handleStyleChange("hairStyle", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="normal">Normal</option>
                        <option value="thick">Thick</option>
                        <option value="mohawk">Mohawk</option>
                        <option value="womanLong">Woman Long</option>
                        <option value="womanShort">Woman Short</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Hair Color</label>
                      <select
                        value={config.hairColor || "#000"}
                        onChange={(e) => handleStyleChange("hairColor", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="#000000">Black</option>
                        <option value="#2C1B18">Dark Brown</option>
                        <option value="#724133">Brown</option>
                        <option value="#B58143">Light Brown</option>
                        <option value="#D6B370">Blonde</option>
                        <option value="#ECDCBF">Platinum</option>
                        <option value="#C93305">Red</option>
                        <option value="#E16381">Pink</option>
                        <option value="#6A8CCB">Blue</option>
                        <option value="#77DD77">Green</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Hat Style</label>
                      <select
                        value={config.hatStyle || "none"}
                        onChange={(e) => handleStyleChange("hatStyle", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="none">None</option>
                        <option value="beanie">Beanie</option>
                        <option value="turban">Turban</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Facial Features */}
                <div>
                  <h4 className="text-sm font-semibold text-[#C9D1D9] mb-4 pb-2 border-b border-[#30363D]">Facial Features</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Eye Style</label>
                      <select
                        value={config.eyeStyle || "circle"}
                        onChange={(e) => handleStyleChange("eyeStyle", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="circle">Circle</option>
                        <option value="oval">Oval</option>
                        <option value="smile">Smile</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Glasses</label>
                      <select
                        value={config.glassesStyle || "none"}
                        onChange={(e) => handleStyleChange("glassesStyle", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="none">None</option>
                        <option value="round">Round</option>
                        <option value="square">Square</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Nose Style</label>
                      <select
                        value={config.noseStyle || "short"}
                        onChange={(e) => handleStyleChange("noseStyle", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="short">Short</option>
                        <option value="long">Long</option>
                        <option value="round">Round</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Mouth Style</label>
                      <select
                        value={config.mouthStyle || "smile"}
                        onChange={(e) => handleStyleChange("mouthStyle", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="laugh">Laugh</option>
                        <option value="smile">Smile</option>
                        <option value="peace">Peace</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Clothing */}
                <div>
                  <h4 className="text-sm font-semibold text-[#C9D1D9] mb-4 pb-2 border-b border-[#30363D]">Clothing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Shirt Style</label>
                      <select
                        value={config.shirtStyle || "hoody"}
                        onChange={(e) => handleStyleChange("shirtStyle", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="hoody">Hoody</option>
                        <option value="short">Short</option>
                        <option value="polo">Polo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Shirt Color</label>
                      <select
                        value={config.shirtColor || "#77311D"}
                        onChange={(e) => handleStyleChange("shirtColor", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="#000000">Black</option>
                        <option value="#FFFFFF">White</option>
                        <option value="#77311D">Brown</option>
                        <option value="#2F3C7E">Navy</option>
                        <option value="#FC5A8D">Pink</option>
                        <option value="#6EEB83">Green</option>
                        <option value="#F4D150">Yellow</option>
                        <option value="#E16381">Rose</option>
                        <option value="#9287FF">Purple</option>
                        <option value="#FC9E4F">Orange</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Background */}
                <div>
                  <h4 className="text-sm font-semibold text-[#C9D1D9] mb-4 pb-2 border-b border-[#30363D]">Background</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Background Color</label>
                      <select
                        value={config.bgColor || "#506AF4"}
                        onChange={(e) => handleStyleChange("bgColor", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="#506AF4">Blue</option>
                        <option value="#F4D150">Yellow</option>
                        <option value="#9287FF">Purple</option>
                        <option value="#6EEB83">Green</option>
                        <option value="#FC5A8D">Pink</option>
                        <option value="#FC9E4F">Orange</option>
                        <option value="#E16381">Rose</option>
                        <option value="#77DD77">Mint</option>
                        <option value="#238636">GitHub Green</option>
                        <option value="#161B22">Dark</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#8B949E]">Gradient Background</label>
                      <select
                        value={config.isGradient ? "true" : "false"}
                        onChange={(e) => handleStyleChange("isGradient", e.target.value === "true")}
                        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#30363D] bg-[#0D1117]/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9] hover:text-[#C9D1D9] hover:bg-[#30363D] transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#238636] hover:bg-[#2EA043] text-white transition-all shadow-lg hover:shadow-xl"
          >
            Save Avatar
          </Button>
        </div>
      </div>
    </div>
  );
});

export default AvatarEditor;
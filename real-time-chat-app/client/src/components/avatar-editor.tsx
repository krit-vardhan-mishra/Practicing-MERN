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

const AvatarEditor = memo(function AvatarEditor({
  onSave,
  onClose,
  initialConfig,
}: AvatarEditorProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Modal card – responsive width/height */}
      <div className="relative w-full max-w-full mx-4 h-[95vh] sm:h-[90vh] bg-[#161B22] rounded-xl shadow-2xl border border-[#30363D] flex flex-col overflow-hidden">
        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363D]">
          <div>
            <h2 className="text-xl font-semibold text-[#C9D1D9]">Create Your Avatar</h2>
            <p className="text-xs text-[#8B949E] mt-1">
              Customize every detail to make it uniquely yours
            </p>
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

        {/* ---------- Body (preview + options) ---------- */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* ---- Left: Avatar preview (full-width on mobile) ---- */}
          <div className="w-full sm:w-80 p-4 sm:p-6 border-r border-[#30363D] flex flex-col items-center justify-start bg-[#0D1117]/50">
            <div className="flex flex-col items-center space-y-4 sm:space-y-6 sticky top-0">
              <div className="relative">
                <Avatar
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full ring-4 ring-[#30363D] shadow-2xl"
                  {...config}
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#238636]/10 to-transparent pointer-events-none" />
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

          {/* ---- Right: Scrollable options ---- */}
          <ScrollArea className="flex-1 pb-20 sm:pb-0">
            <div className="p-4 sm:p-6">
              <div className="space-y-6">
                {/* === Appearance === */}
                <Section title="Appearance">
                  <Select
                    label="Gender"
                    value={config.sex || "man"}
                    onChange={(v) => handleStyleChange("sex", v)}
                    options={[
                      { value: "man", label: "Man" },
                      { value: "woman", label: "Woman" },
                    ]}
                  />
                  <Select
                    label="Skin Tone"
                    value={config.faceColor || "#F9C9B6"}
                    onChange={(v) => handleStyleChange("faceColor", v)}
                    options={[
                      { value: "#F9C9B6", label: "Light" },
                      { value: "#E0AC69", label: "Medium Light" },
                      { value: "#C68642", label: "Medium" },
                      { value: "#8D5524", label: "Medium Dark" },
                      { value: "#5C4033", label: "Dark" },
                      { value: "#3D2817", label: "Very Dark" },
                    ]}
                  />
                  <Select
                    label="Ear Size"
                    value={config.earSize || "small"}
                    onChange={(v) => handleStyleChange("earSize", v)}
                    options={[
                      { value: "small", label: "Small" },
                      { value: "big", label: "Big" },
                    ]}
                  />
                </Section>

                {/* === Hair === */}
                <Section title="Hair">
                  <Select
                    label="Hair Style"
                    value={config.hairStyle || "normal"}
                    onChange={(v) => handleStyleChange("hairStyle", v)}
                    options={[
                      { value: "normal", label: "Normal" },
                      { value: "thick", label: "Thick" },
                      { value: "mohawk", label: "Mohawk" },
                      { value: "womanLong", label: "Woman Long" },
                      { value: "womanShort", label: "Woman Short" },
                    ]}
                  />
                  <Select
                    label="Hair Color"
                    value={config.hairColor || "#000"}
                    onChange={(v) => handleStyleChange("hairColor", v)}
                    options={[
                      { value: "#000000", label: "Black" },
                      { value: "#2C1B18", label: "Dark Brown" },
                      { value: "#724133", label: "Brown" },
                      { value: "#B58143", label: "Light Brown" },
                      { value: "#D6B370", label: "Blonde" },
                      { value: "#ECDCBF", label: "Platinum" },
                      { value: "#C93305", label: "Red" },
                      { value: "#E16381", label: "Pink" },
                      { value: "#6A8CCB", label: "Blue" },
                      { value: "#77DD77", label: "Green" },
                    ]}
                  />
                  <Select
                    label="Hat Style"
                    value={config.hatStyle || "none"}
                    onChange={(v) => handleStyleChange("hatStyle", v)}
                    options={[
                      { value: "none", label: "None" },
                      { value: "beanie", label: "Beanie" },
                      { value: "turban", label: "Turban" },
                    ]}
                  />
                </Section>

                {/* === Facial Features === */}
                <Section title="Facial Features">
                  <Select
                    label="Eye Style"
                    value={config.eyeStyle || "circle"}
                    onChange={(v) => handleStyleChange("eyeStyle", v)}
                    options={[
                      { value: "circle", label: "Circle" },
                      { value: "oval", label: "Oval" },
                      { value: "smile", label: "Smile" },
                    ]}
                  />
                  <Select
                    label="Glasses"
                    value={config.glassesStyle || "none"}
                    onChange={(v) => handleStyleChange("glassesStyle", v)}
                    options={[
                      { value: "none", label: "None" },
                      { value: "round", label: "Round" },
                      { value: "square", label: "Square" },
                    ]}
                  />
                  <Select
                    label="Nose Style"
                    value={config.noseStyle || "short"}
                    onChange={(v) => handleStyleChange("noseStyle", v)}
                    options={[
                      { value: "short", label: "Short" },
                      { value: "long", label: "Long" },
                      { value: "round", label: "Round" },
                    ]}
                  />
                  <Select
                    label="Mouth Style"
                    value={config.mouthStyle || "smile"}
                    onChange={(v) => handleStyleChange("mouthStyle", v)}
                    options={[
                      { value: "laugh", label: "Laugh" },
                      { value: "smile", label: "Smile" },
                      { value: "peace", label: "Peace" },
                    ]}
                  />
                </Section>

                {/* === Clothing === */}
                <Section title="Clothing">
                  <Select
                    label="Shirt Style"
                    value={config.shirtStyle || "hoody"}
                    onChange={(v) => handleStyleChange("shirtStyle", v)}
                    options={[
                      { value: "hoody", label: "Hoody" },
                      { value: "short", label: "Short" },
                      { value: "polo", label: "Polo" },
                    ]}
                  />
                  <Select
                    label="Shirt Color"
                    value={config.shirtColor || "#77311D"}
                    onChange={(v) => handleStyleChange("shirtColor", v)}
                    options={[
                      { value: "#000000", label: "Black" },
                      { value: "#FFFFFF", label: "White" },
                      { value: "#77311D", label: "Brown" },
                      { value: "#2F3C7E", label: "Navy" },
                      { value: "#FC5A8D", label: "Pink" },
                      { value: "#6EEB83", label: "Green" },
                      { value: "#F4D150", label: "Yellow" },
                      { value: "#E16381", label: "Rose" },
                      { value: "#9287FF", label: "Purple" },
                      { value: "#FC9E4F", label: "Orange" },
                    ]}
                  />
                </Section>

                {/* === Background === */}
                <Section title="Background">
                  <Select
                    label="Background Color"
                    value={config.bgColor || "#506AF4"}
                    onChange={(v) => handleStyleChange("bgColor", v)}
                    options={[
                      { value: "#506AF4", label: "Blue" },
                      { value: "#F4D150", label: "Yellow" },
                      { value: "#9287FF", label: "Purple" },
                      { value: "#6EEB83", label: "Green" },
                      { value: "#FC5A8D", label: "Pink" },
                      { value: "#FC9E4F", label: "Orange" },
                      { value: "#E16381", label: "Rose" },
                      { value: "#77DD77", label: "Mint" },
                      { value: "#238636", label: "GitHub Green" },
                      { value: "#161B22", label: "Dark" },
                    ]}
                  />
                  <Select
                    label="Gradient Background"
                    value={config.isGradient ? "true" : "false"}
                    onChange={(v) => handleStyleChange("isGradient", v === "true")}
                    options={[
                      { value: "false", label: "No" },
                      { value: "true", label: "Yes" },
                    ]}
                  />
                </Section>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* ---------- Footer – fixed on mobile, normal on larger screens ---------- */}
        <div className="sm:relative fixed inset-x-0 bottom-0 flex items-center justify-end gap-3 p-4 border-t border-[#30363D] bg-[#0D1117]/50">
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

/* --------------------------------------------------------------
   Tiny reusable components to keep the JSX tidy
   -------------------------------------------------------------- */
type Option = { value: string; label: string };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#C9D1D9] mb-4 pb-2 border-b border-[#30363D]">
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#8B949E]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-[#30363D] text-[#C9D1D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#238636] transition-all hover:border-[#8B949E]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AvatarEditor;
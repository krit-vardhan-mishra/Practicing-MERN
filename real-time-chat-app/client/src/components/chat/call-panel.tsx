import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, PhoneCall } from "lucide-react";
import type { CallMedia, CallState } from "@/hooks/use-webrtc";

interface CallPanelProps {
  visible: boolean;
  callState: CallState;
  otherUser?: { id: number; name: string } | null;
  currentUserName?: string;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  remoteStreamRef: React.MutableRefObject<MediaStream | null>;
  onAccept?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
}

export default function CallPanel({
  visible,
  callState,
  otherUser,
  currentUserName,
  localStreamRef,
  remoteStreamRef,
  onAccept,
  onReject,
  onEnd,
}: CallPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    const local = localVideoRef.current;
    const remote = remoteVideoRef.current;
    
    if (local && localStreamRef.current) {
      console.debug("[CallPanel] bind local video srcObject", { 
        hasStream: !!localStreamRef.current,
        tracks: localStreamRef.current?.getTracks().length 
      });
      local.srcObject = localStreamRef.current;
      local.onloadedmetadata = () => {
        console.debug("[CallPanel] local video metadata loaded");
        try { local.play().catch((e) => console.warn("local play failed:", e)); } catch {}
      };
      if (local.readyState >= 2) {
        try { local.play().catch(() => {}); } catch {}
      }
    }
    
    if (remote && remoteStreamRef.current) {
      console.debug("[CallPanel] bind remote video srcObject", { 
        hasStream: !!remoteStreamRef.current,
        tracks: remoteStreamRef.current?.getTracks().length 
      });
      remote.srcObject = remoteStreamRef.current;
      remote.onloadedmetadata = () => {
        console.debug("[CallPanel] remote video metadata loaded");
        try { remote.play().catch((e) => console.warn("remote play failed:", e)); } catch {}
      };
      if (remote.readyState >= 2) {
        try { remote.play().catch(() => {}); } catch {}
      }
    }
    
    const remoteStream = remoteStreamRef.current;
    const handleAddTrack = (ev: Event) => {
      console.debug("[CallPanel] remote stream addtrack", { 
        track: (ev as any).track?.kind 
      });
      const v = remoteVideoRef.current;
      if (v) {
        if (remoteStreamRef.current) {
          v.srcObject = remoteStreamRef.current;
        }
        try { v.play().catch(() => {}); } catch {}
      }
    };
    
    if (remoteStream && "addEventListener" in remoteStream) {
      remoteStream.addEventListener("addtrack", handleAddTrack as EventListener);
    }
    
    return () => {
      if (remoteStream && "removeEventListener" in remoteStream) {
        remoteStream.removeEventListener("addtrack", handleAddTrack as EventListener);
      }
    };
  }, [visible, callState.status, localStreamRef.current, remoteStreamRef.current]);

  if (!visible) return null;

  const isRinging = callState.status === "ringing";
  const isCalling = callState.status === "calling";
  const inCall = callState.status === "in-call";
  const media: CallMedia | undefined = callState.status !== "idle" && "media" in callState ? callState.media : undefined;

  return (
    <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[95vw] sm:max-w-3xl bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-2 sm:p-3 border-b border-[#30363D] flex items-center justify-between">
          <div className="text-[#C9D1D9] min-w-0 flex-1">
            <div className="font-semibold text-base sm:text-lg truncate">{otherUser?.name || "Unknown User"}</div>
            <div className="text-xs sm:text-sm text-gray-400">
              {isRinging && (
                <span>
                  Incoming {media?.video ? "video" : "voice"} call...
                </span>
              )}
              {isCalling && (
                <span>
                  Calling... ({media?.video ? "video" : "voice"})
                </span>
              )}
              {inCall && (
                <span className="text-green-500">
                  {media?.video ? "Video call" : "Voice call"} • Connected
                </span>
              )}
              {callState.status === "ended" && "Call ended"}
            </div>
          </div>
          <PhoneCall className={`${inCall ? "text-green-500" : "text-[#238636]"} ${inCall ? "animate-pulse" : ""} w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ml-2`} />
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 p-2 sm:p-3">
          {/* Remote Video */}
          <div className="relative bg-black aspect-video rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 text-[10px] sm:text-xs md:text-sm text-gray-300 bg-black/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
              {otherUser?.name || "Remote"}
            </div>
            {(!inCall && !isCalling && !isRinging) && (
              <div className="text-gray-500 text-xs sm:text-sm">Remote video</div>
            )}
          </div>

          {/* Local Video */}
          <div className="relative bg-black/80 aspect-video rounded-lg overflow-hidden flex items-center justify-center">
            {media?.video ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
              <div className="text-gray-500 text-xs sm:text-sm">Microphone only</div>
            )}
            <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 text-[10px] sm:text-xs md:text-sm text-gray-300 bg-black/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
              {currentUserName || "You"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-2 sm:p-4 flex items-center justify-center gap-2 sm:gap-4 border-t border-[#30363D]">
          {isRinging && (
            <>
              <Button 
                onClick={() => { 
                  console.debug("[CallPanel] Accept clicked"); 
                  onAccept?.(); 
                }} 
                className="bg-[#238636] hover:bg-[#238636]/90 h-9 sm:h-10 text-sm sm:text-base px-4 sm:px-6"
              >
                Accept
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => { 
                  console.debug("[CallPanel] Reject clicked"); 
                  onReject?.(); 
                }}
                className="h-9 sm:h-10 text-sm sm:text-base px-4 sm:px-6"
              >
                Reject
              </Button>
            </>
          )}
          {(isCalling || inCall) && (
            <>
              {/* Audio Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = !audioEnabled;
                  localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
                  setAudioEnabled(next);
                  console.debug("[CallPanel] toggle audio", { enabled: next });
                }}
                className="text-gray-300 hover:bg-[#30363D] h-9 w-9 sm:h-10 sm:w-10"
                title={audioEnabled ? "Mute" : "Unmute"}
              >
                {audioEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>

              {/* Video Toggle (only if video call) */}
              {media?.video && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = !videoEnabled;
                    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
                    setVideoEnabled(next);
                    console.debug("[CallPanel] toggle video", { enabled: next });
                  }}
                  className="text-gray-300 hover:bg-[#30363D] h-9 w-9 sm:h-10 sm:w-10"
                  title={videoEnabled ? "Turn camera off" : "Turn camera on"}
                >
                  {videoEnabled ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </Button>
              )}

              {/* End Call */}
              <Button 
                variant="destructive" 
                onClick={() => { 
                  console.debug("[CallPanel] End clicked"); 
                  onEnd?.(); 
                }} 
                className="rounded-full h-9 w-9 sm:h-10 sm:w-10" 
                title="End call"
                size="icon"
              >
                <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
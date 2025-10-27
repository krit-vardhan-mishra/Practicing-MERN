import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, PhoneCall } from "lucide-react";
import type { CallMedia, CallState } from "@/hooks/use-webrtc";

interface CallPanelProps {
  visible: boolean;
  callState: CallState;
  otherUser?: { id: number; name: string } | null;
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
    if (local) {
      local.srcObject = localStreamRef.current;
    }
    if (remote) {
      remote.srcObject = remoteStreamRef.current;
    }
  }, [visible, callState.status]);

  if (!visible) return null;

  const isRinging = callState.status === "ringing";
  const isCalling = callState.status === "calling";
  const inCall = callState.status === "in-call";
  const media: CallMedia | undefined = callState.status !== "idle" && "media" in callState ? callState.media : undefined;

  return (
    <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-3 border-b border-[#30363D] flex items-center justify-between">
          <div className="text-[#C9D1D9]">
            <div className="font-semibold">{otherUser?.name || "Call"}</div>
            <div className="text-sm text-gray-400">
              {isRinging && "Incoming call"}
              {isCalling && "Calling…"}
              {inCall && (media?.video ? "Video call" : "Voice call")}
              {callState.status === "ended" && "Call ended"}
            </div>
          </div>
          <PhoneCall className="text-[#238636]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
          <div className="bg-black aspect-video rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rotate-y-180" />
            {(!inCall && !isCalling && !isRinging) && (
              <div className="text-gray-500">Remote video</div>
            )}
          </div>
          <div className="bg-black/80 aspect-video rounded-lg overflow-hidden flex items-center justify-center">
            {media?.video ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rotate-y-180" />
            ) : (
              <div className="text-gray-500">Microphone only</div>
            )}
          </div>
        </div>

        <div className="p-4 flex items-center justify-center gap-4 border-t border-[#30363D]">
          {isRinging && (
            <>
              <Button onClick={onAccept} className="bg-[#238636] hover:bg-[#238636]/90">Accept</Button>
              <Button variant="destructive" onClick={onReject}>Reject</Button>
            </>
          )}
          {(isCalling || inCall) && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = !audioEnabled;
                  localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
                  setAudioEnabled(next);
                }}
                className="text-gray-300 hover:bg-[#30363D]"
                title={audioEnabled ? "Mute" : "Unmute"}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              {media?.video && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = !videoEnabled;
                    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
                    setVideoEnabled(next);
                  }}
                  className="text-gray-300 hover:bg-[#30363D]"
                  title={videoEnabled ? "Turn camera off" : "Turn camera on"}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              )}
              <Button variant="destructive" onClick={onEnd} className="rounded-full" title="End call">
                <PhoneOff className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export type CallMedia = { audio: boolean; video: boolean };
export type CallState =
  | { status: "idle" }
  | { status: "calling"; peerId: number; media: CallMedia }
  | { status: "ringing"; peerId: number; media: CallMedia }
  | { status: "in-call"; peerId: number; media: CallMedia }
  | { status: "ended"; reason?: string };

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

export function useWebRTC(socket: Socket | null, currentUserId: number | undefined) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>({ status: "idle" });
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  const cleanup = useCallback(() => {
    pcRef.current?.onicecandidate && (pcRef.current.onicecandidate = null);
    pcRef.current?.ontrack && (pcRef.current.ontrack = null);
    pcRef.current?.onconnectionstatechange && (pcRef.current.onconnectionstatechange = null);

    pcRef.current?.getSenders().forEach((s) => {
      try { pcRef.current?.removeTrack(s); } catch {}
    });

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
  }, []);

  const endCall = useCallback((toUserId?: number) => {
    if (socket && toUserId) {
      socket.emit("end_call", { toUserId });
    }
    cleanup();
    setCallState({ status: "ended" });
    // Transition back to idle after a small delay to allow UI to show end state
    setTimeout(() => setCallState({ status: "idle" }), 400);
  }, [cleanup, socket]);

  const getMedia = useCallback(async (media: CallMedia) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: media.audio,
      video: media.video,
    });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    pc.ontrack = (ev) => {
      ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && callState.status !== "idle" && "peerId" in callState) {
        socket?.emit("ice_candidate", { toUserId: callState.peerId, candidate: ev.candidate.toJSON() });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        if (callState.status !== "idle" && "peerId" in callState) {
          endCall(callState.peerId);
        } else {
          cleanup();
          setCallState({ status: "idle" });
        }
      }
    };

    return pc;
  }, [socket, callState, endCall, cleanup]);

  const startCall = useCallback(
    async (toUserId: number, media: CallMedia) => {
      if (!socket || !currentUserId) return;
      try {
        const pc = createPeer();
        const localStream = await getMedia(media);
        localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: media.video });
        await pc.setLocalDescription(offer);

        setCallState({ status: "calling", peerId: toUserId, media });
        socket.emit("call_user", { toUserId, offer, media });
      } catch (err) {
        console.error("startCall error", err);
        setCallState({ status: "ended", reason: "Could not start call" });
        setTimeout(() => setCallState({ status: "idle" }), 400);
      }
    },
    [socket, currentUserId, createPeer, getMedia]
  );

  const acceptCall = useCallback(async (fromUserId: number, offer: RTCSessionDescriptionInit, media: CallMedia) => {
    if (!socket || !currentUserId) return;
    try {
      const pc = createPeer();
      const localStream = await getMedia(media);
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer_call", { toUserId: fromUserId, answer });
      setCallState({ status: "in-call", peerId: fromUserId, media });
    } catch (err) {
      console.error("acceptCall error", err);
      setCallState({ status: "ended", reason: "Failed to accept call" });
      setTimeout(() => setCallState({ status: "idle" }), 400);
    }
  }, [socket, currentUserId, createPeer, getMedia]);

  const rejectCall = useCallback((fromUserId: number) => {
    socket?.emit("reject_call", { toUserId: fromUserId });
    setCallState({ status: "idle" });
  }, [socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = async (payload: { fromUserId: number; offer: RTCSessionDescriptionInit; media: CallMedia }) => {
      incomingOfferRef.current = payload.offer;
      setCallState({ status: "ringing", peerId: payload.fromUserId, media: payload.media });
      // Defer accepting until UI triggers acceptCall
    };

    const onCallAnswer = async (payload: { fromUserId: number; answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      if (callState.status === "calling") {
        setCallState((s) => (s.status === "calling" ? { status: "in-call", peerId: s.peerId, media: s.media } : s));
      }
    };

    const onIceCandidate = async (payload: { fromUserId: number; candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch (e) { console.warn("addIceCandidate failed", e); }
    };

    const onCallEnded = () => {
      cleanup();
      setCallState({ status: "ended" });
      setTimeout(() => setCallState({ status: "idle" }), 400);
    };

    const onCallRejected = (payload: { fromUserId: number; reason?: string }) => {
      cleanup();
      setCallState({ status: "ended", reason: payload.reason || "Call rejected" });
      setTimeout(() => setCallState({ status: "idle" }), 600);
    };

    socket.on("incoming_call", onIncomingCall);
    socket.on("call_answer", onCallAnswer);
    socket.on("ice_candidate", onIceCandidate);
    socket.on("call_ended", onCallEnded);
    socket.on("call_rejected", onCallRejected);

    return () => {
      socket.off("incoming_call", onIncomingCall);
      socket.off("call_answer", onCallAnswer);
      socket.off("ice_candidate", onIceCandidate);
      socket.off("call_ended", onCallEnded);
      socket.off("call_rejected", onCallRejected);
    };
  }, [socket, cleanup, callState.status]);

  return {
    // state
    callState,
    localStream: localStreamRef,
    remoteStream: remoteStreamRef,
    // actions
    startCall,
    acceptCall,
    acceptRinging: async () => {
      if (callState.status !== "ringing" || !incomingOfferRef.current || !("peerId" in callState)) return;
      await acceptCall(callState.peerId, incomingOfferRef.current, callState.media);
    },
    rejectCall,
    endCall,
    toggleLocalAudio: (enabled: boolean) => {
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    },
    toggleLocalVideo: (enabled: boolean) => {
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    },
  } as const;
}

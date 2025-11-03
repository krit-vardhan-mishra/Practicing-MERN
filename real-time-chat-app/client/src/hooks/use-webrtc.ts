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
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(socket: Socket | null, currentUserId: number | undefined) {
  // Simple debug helper to keep logs consistent and easy to filter
  const log = useCallback(
    (event: string, data?: unknown) => {
      const ts = new Date().toISOString();
      // Using console.debug so it can be filtered easily
      if (data !== undefined) console.debug(`[WebRTC ${ts}] ${event}`, data);
      else console.debug(`[WebRTC ${ts}] ${event}`);
    },
    []
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>({ status: "idle" });
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  // Track active peerId and chosen media without relying on state inside event handlers
  const peerIdRef = useRef<number | null>(null);
  const mediaRef = useRef<CallMedia | null>(null);

  const cleanup = useCallback(() => {
    log("cleanup: start");
    pcRef.current?.onicecandidate && (pcRef.current.onicecandidate = null);
    pcRef.current?.ontrack && (pcRef.current.ontrack = null);
    pcRef.current?.onconnectionstatechange && (pcRef.current.onconnectionstatechange = null);
    // Extra handlers for debug-only
    if (pcRef.current) {
      (pcRef.current as any).onicegatheringstatechange = null;
      (pcRef.current as any).oniceconnectionstatechange = null;
      (pcRef.current as any).onsignalingstatechange = null;
      (pcRef.current as any).onnegotiationneeded = null;
    }

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
    peerIdRef.current = null;
    mediaRef.current = null;
    incomingOfferRef.current = null;
    log("cleanup: end");
  }, []);

  const endCall = useCallback((toUserId?: number) => {
    log("endCall invoked", { toUserId });
    if (socket && toUserId) {
      log("emit:end_call", { toUserId });
      socket.emit("end_call", { toUserId });
    }
    cleanup();
    setCallState({ status: "ended" });
    // Transition back to idle after a small delay to allow UI to show end state
    setTimeout(() => setCallState({ status: "idle" }), 400);
  }, [cleanup, socket, log]);

  const getMediaWithFallback = useCallback(async (media: CallMedia): Promise<{ stream: MediaStream; mediaUsed: CallMedia }> => {
    log("getMedia request", media);
    // Stop previous local tracks if any to release devices
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    const tryAcquire = async (m: CallMedia) => {
      const constraints: MediaStreamConstraints = {
        audio: m.audio,
        video: m.video ? { 
          width: { ideal: 1280, max: 1920 }, 
          height: { ideal: 720, max: 1080 },
          facingMode: "user" // Prefer front camera on mobile
        } : false,
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      return s;
    };

    try {
      const stream = await tryAcquire(media);
      localStreamRef.current = stream;
      log("getMedia success", {
        requested: media,
        audioTracks: stream.getAudioTracks().map((t) => ({ id: t.id, enabled: t.enabled })),
        videoTracks: stream.getVideoTracks().map((t) => ({ id: t.id, enabled: t.enabled })),
      });
      return { stream, mediaUsed: media };
    } catch (err: any) {
      // Handle device busy cases for video: retry with audio-only if video is requested
      if (media.video && (err?.name === "NotReadableError" || err?.name === "TrackStartError" || err?.name === "NotAllowedError")) {
        log("getMedia error: retrying without video", { err: err?.name, message: err?.message });
        try {
          const audioOnly: CallMedia = { audio: media.audio, video: false };
          const audioStream = await tryAcquire(audioOnly);
          localStreamRef.current = audioStream;
          log("getMedia fallback success (audio-only)", {
            audioTracks: audioStream.getAudioTracks().map((t) => ({ id: t.id, enabled: t.enabled })),
          });

          // Try to acquire a display video as an alternative - but only on desktop (not mobile)
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (!isMobile && typeof (navigator.mediaDevices as any).getDisplayMedia === 'function') {
            try {
              const displayStream = await (navigator.mediaDevices as any).getDisplayMedia?.({ video: true, audio: false });
              if (displayStream && displayStream.getVideoTracks().length > 0) {
                const composed = new MediaStream([
                  ...audioStream.getAudioTracks(),
                  ...displayStream.getVideoTracks(),
                ]);
                // Keep references to stop display track on cleanup via localStreamRef
                localStreamRef.current = composed;
                log("getDisplayMedia success: composing audio + display video", {
                  videoTrackId: displayStream.getVideoTracks()[0].id,
                });
                return { stream: composed, mediaUsed: { audio: true, video: true } };
              }
            } catch (dispErr) {
              log("getDisplayMedia not granted or failed", dispErr);
            }
          }

          // If display share not available or on mobile, stay audio-only
          return { stream: audioStream, mediaUsed: audioOnly };
        } catch (e2) {
          log("getMedia fallback failed", e2);
          throw err; // surface original error
        }
      }
      log("getMedia error", err);
      throw err;
    }
  }, [log]);

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    pc.ontrack = (ev) => {
      log("pc.ontrack", {
        trackKind: ev.track?.kind,
        trackId: ev.track?.id,
        streams: ev.streams?.map((s) => s.id),
        enabled: ev.track?.enabled,
      });
      
      // Add track to remote stream if not already there
      const existingTrack = remoteStream.getTracks().find(t => t.id === ev.track.id);
      if (!existingTrack && ev.track) {
        log("pc.ontrack: adding track to remoteStream", { 
          kind: ev.track.kind,
          id: ev.track.id 
        });
        remoteStream.addTrack(ev.track);
        
        // Force a state update to trigger video element re-render
        setCallState(s => ({ ...s }));
      } else {
        log("pc.ontrack: track already exists or no track", { trackId: ev.track?.id });
      }
    };

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      const toUserId = peerIdRef.current;
      log("pc.onicecandidate", { toUserId, candidate: ev.candidate?.candidate });
      if (socket && toUserId) {
        socket.emit("ice_candidate", { toUserId, candidate: ev.candidate.toJSON() });
      }
    };

    pc.onconnectionstatechange = () => {
      log("pc.onconnectionstatechange", { state: pc.connectionState });
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        const toUserId = peerIdRef.current || undefined;
        endCall(toUserId);
      }
      // NOTE: do not treat "disconnected" as fatal; it can recover
    };

    // Extra debug hooks
    pc.oniceconnectionstatechange = () => {
      log("pc.oniceconnectionstatechange", { state: pc.iceConnectionState });
    };
    pc.onicegatheringstatechange = () => {
      log("pc.onicegatheringstatechange", { state: pc.iceGatheringState });
    };
    pc.onsignalingstatechange = () => {
      log("pc.onsignalingstatechange", { state: pc.signalingState });
    };
    pc.onnegotiationneeded = async () => {
      log("pc.onnegotiationneeded");
    };

    return pc;
  }, [socket, endCall, cleanup, log]);

  const startCall = useCallback(
    async (toUserId: number, media: CallMedia) => {
      if (!socket || !currentUserId) return;
      try {
        log("startCall invoked", { toUserId, media });
        peerIdRef.current = toUserId;
        mediaRef.current = media;
        const pc = createPeer();
        const { stream: localStream, mediaUsed } = await getMediaWithFallback(media);
        localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

        // Still request to receive video if the original intent was video
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: media.video });
        await pc.setLocalDescription(offer);
        log("createOffer done", { 
          hasAudio: offer.sdp?.includes("m=audio"),
          hasVideo: offer.sdp?.includes("m=video"),
          localTracks: localStream.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled }))
        });

        setCallState({ status: "calling", peerId: toUserId, media: mediaUsed });
        log("emit:call_user", { toUserId, mediaUsed });
        socket.emit("call_user", { toUserId, offer, media: mediaUsed });
      } catch (err) {
        console.error("startCall error", err);
        setCallState({ status: "ended", reason: "Could not start call" });
        setTimeout(() => setCallState({ status: "idle" }), 400);
      }
    },
    [socket, currentUserId, createPeer, getMediaWithFallback, log]
  );

  const acceptCall = useCallback(async (fromUserId: number, offer: RTCSessionDescriptionInit, media: CallMedia) => {
    if (!socket || !currentUserId) return;
    try {
      log("acceptCall invoked", { fromUserId, media });
      peerIdRef.current = fromUserId;
      mediaRef.current = media;
      const pc = createPeer();
      const { stream: localStream, mediaUsed } = await getMediaWithFallback(media);
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      log("setRemoteDescription(offer) done", { 
        hasAudio: offer.sdp?.includes("m=audio"),
        hasVideo: offer.sdp?.includes("m=video"),
      });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      log("setLocalDescription(answer) done", { 
        sdp: answer.sdp?.substring(0, 200) + "...",
        hasAudio: answer.sdp?.includes("m=audio"),
        hasVideo: answer.sdp?.includes("m=video"),
      });

      log("emit:answer_call", { toUserId: fromUserId });
      socket.emit("answer_call", { toUserId: fromUserId, answer });
      setCallState({ status: "in-call", peerId: fromUserId, media: mediaUsed });
    } catch (err) {
      console.error("acceptCall error", err);
      setCallState({ status: "ended", reason: "Failed to accept call" });
      setTimeout(() => setCallState({ status: "idle" }), 400);
    }
  }, [socket, currentUserId, createPeer, getMediaWithFallback, log]);

  const rejectCall = useCallback((fromUserId: number) => {
    log("emit:reject_call", { toUserId: fromUserId });
    socket?.emit("reject_call", { toUserId: fromUserId });
    setCallState({ status: "idle" });
  }, [socket, log]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = async (payload: { fromUserId: number; offer: RTCSessionDescriptionInit; media: CallMedia }) => {
      log("on:incoming_call", payload);
      incomingOfferRef.current = payload.offer;
      setCallState({ status: "ringing", peerId: payload.fromUserId, media: payload.media });
      // Defer accepting until UI triggers acceptCall
    };

    const onCallAnswer = async (payload: { fromUserId: number; answer: RTCSessionDescriptionInit }) => {
      log("on:call_answer", { fromUserId: payload.fromUserId });
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      log("setRemoteDescription(answer) done");
      if (callState.status === "calling") {
        setCallState((s) => (s.status === "calling" ? { status: "in-call", peerId: s.peerId, media: s.media } : s));
      }
    };

    const onIceCandidate = async (payload: { fromUserId: number; candidate: RTCIceCandidateInit }) => {
      log("on:ice_candidate", { fromUserId: payload.fromUserId, candidate: payload.candidate?.candidate });
      const pc = pcRef.current;
      if (!pc) return;
      try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); log("pc.addIceCandidate ok"); } catch (e) { console.warn("addIceCandidate failed", e); }
    };

    const onCallEnded = () => {
      log("on:call_ended");
      cleanup();
      setCallState({ status: "ended" });
      setTimeout(() => setCallState({ status: "idle" }), 400);
    };

    const onCallRejected = (payload: { fromUserId: number; reason?: string }) => {
      log("on:call_rejected", payload);
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
  }, [socket, cleanup, callState.status, log]);

  return {
    // state
    callState,
    localStream: localStreamRef,
    remoteStream: remoteStreamRef,
    // actions
    startCall,
    acceptCall,
    acceptRinging: async () => {
      log("acceptRinging clicked");
      if (callState.status !== "ringing" || !incomingOfferRef.current || !("peerId" in callState)) return;
      await acceptCall(callState.peerId, incomingOfferRef.current, callState.media);
    },
    rejectCall,
    endCall,
    toggleLocalAudio: (enabled: boolean) => {
      log("toggleLocalAudio", { enabled });
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    },
    toggleLocalVideo: (enabled: boolean) => {
      log("toggleLocalVideo", { enabled });
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    },
  } as const;
}

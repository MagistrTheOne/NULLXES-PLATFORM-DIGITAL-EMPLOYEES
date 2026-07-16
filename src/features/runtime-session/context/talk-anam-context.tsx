"use client";

import { patchAnamBrowserFetch } from "@/features/runtime-session/lib/patch-anam-browser-fetch";

patchAnamBrowserFetch();

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AnamClient } from "@anam-ai/js-sdk";
import { releaseAnamInputAudioStream } from "@/features/runtime-session/lib/acquire-anam-input-audio-stream";

export type TalkPipelineState = "idle" | "listening" | "thinking" | "speaking";
export type TalkMicPermission = "unknown" | "pending" | "granted" | "denied";

type TalkAnamContextValue = {
  registerClient: (client: AnamClient | null) => void;
  getClient: () => AnamClient | null;
  micMuted: boolean;
  micPermission: TalkMicPermission;
  setMicPermission: (state: TalkMicPermission) => void;
  toggleMic: () => void;
  syncMicFromClient: () => void;
  ensureMicActive: () => void;
  /** Stash mic stream acquired inside the Start tap (mobile gesture). */
  stashPendingInputStream: (stream: MediaStream) => void;
  /** Consume stashed stream once when Anam stage starts (or null). */
  takePendingInputStream: () => MediaStream | null;
  clearPendingInputStream: () => void;
  stopSession: () => Promise<void>;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  pipelineState: TalkPipelineState;
  setPipelineState: (state: TalkPipelineState) => void;
  isStoppingIntentionally: () => boolean;
};

const TalkAnamContext = createContext<TalkAnamContextValue | null>(null);

export function TalkAnamProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<AnamClient | null>(null);
  const clientRef = useRef<AnamClient | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [micPermission, setMicPermission] =
    useState<TalkMicPermission>("unknown");
  const [isLive, setIsLive] = useState(false);
  const [pipelineState, setPipelineState] =
    useState<TalkPipelineState>("idle");
  const stoppingIntentionallyRef = useRef(false);
  const userMutedMicRef = useRef(false);
  const pendingInputStreamRef = useRef<MediaStream | null>(null);

  const clearPendingInputStream = useCallback(() => {
    releaseAnamInputAudioStream(pendingInputStreamRef.current);
    pendingInputStreamRef.current = null;
  }, []);

  const stashPendingInputStream = useCallback(
    (stream: MediaStream) => {
      if (
        pendingInputStreamRef.current &&
        pendingInputStreamRef.current !== stream
      ) {
        releaseAnamInputAudioStream(pendingInputStreamRef.current);
      }
      pendingInputStreamRef.current = stream;
    },
    [],
  );

  const takePendingInputStream = useCallback((): MediaStream | null => {
    const stream = pendingInputStreamRef.current;
    pendingInputStreamRef.current = null;
    return stream;
  }, []);

  const registerClient = useCallback((next: AnamClient | null) => {
    clientRef.current = next;

    if (next) {
      stoppingIntentionallyRef.current = false;
      userMutedMicRef.current = false;
    }

    setClient(next);

    if (!next) {
      setMicMuted(false);
      setMicPermission("unknown");
      setIsLive(false);
      setPipelineState("idle");
    }
  }, []);

  const syncMicFromClient = useCallback(() => {
    const active = clientRef.current;
    if (!active) {
      return;
    }

    try {
      const state = active.getInputAudioState();
      setMicMuted(state.isMuted);
      userMutedMicRef.current = state.isMuted;

      // Mirror the SDK's authoritative permission state so the live mic
      // indicator stays accurate even if an event was missed.
      switch (state.permissionState) {
        case "granted":
          setMicPermission("granted");
          break;
        case "denied":
          setMicPermission("denied");
          break;
        case "pending":
          setMicPermission("pending");
          break;
        default:
          break;
      }
    } catch {
      // ignore SDK state read errors
    }
  }, []);

  const ensureMicActive = useCallback(() => {
    const active = clientRef.current;
    if (!active || userMutedMicRef.current) {
      return;
    }

    try {
      const state = active.getInputAudioState();
      if (state.isMuted) {
        active.unmuteInputAudio();
      }
      setMicMuted(false);
    } catch {
      // ignore SDK mic activation errors
    }
  }, []);

  const toggleMic = useCallback(() => {
    const active = clientRef.current;
    if (!active) {
      return;
    }

    const state = active.getInputAudioState();
    if (state.isMuted) {
      active.unmuteInputAudio();
      userMutedMicRef.current = false;
      setMicMuted(false);
    } else {
      active.muteInputAudio();
      userMutedMicRef.current = true;
      setMicMuted(true);
    }
  }, []);

  const stopSession = useCallback(async () => {
    const active = clientRef.current;
    clientRef.current = null;
    stoppingIntentionallyRef.current = true;
    clearPendingInputStream();
    setClient(null);
    setMicMuted(false);
    setMicPermission("unknown");
    setIsLive(false);
    setPipelineState("idle");
    userMutedMicRef.current = false;
    if (active) {
      await active.stopStreaming().catch(() => undefined);
    }
  }, [clearPendingInputStream]);

  const isStoppingIntentionally = useCallback(
    () => stoppingIntentionallyRef.current,
    [],
  );

  const getClient = useCallback(() => client, [client]);

  const value = useMemo(
    () => ({
      registerClient,
      getClient,
      micMuted,
      micPermission,
      setMicPermission,
      toggleMic,
      syncMicFromClient,
      ensureMicActive,
      stashPendingInputStream,
      takePendingInputStream,
      clearPendingInputStream,
      stopSession,
      isLive,
      setIsLive,
      pipelineState,
      setPipelineState,
      isStoppingIntentionally,
    }),
    [
      registerClient,
      getClient,
      micMuted,
      micPermission,
      toggleMic,
      syncMicFromClient,
      ensureMicActive,
      stashPendingInputStream,
      takePendingInputStream,
      clearPendingInputStream,
      stopSession,
      isLive,
      pipelineState,
      isStoppingIntentionally,
    ],
  );

  return (
    <TalkAnamContext.Provider value={value}>{children}</TalkAnamContext.Provider>
  );
}

export function useTalkAnam(): TalkAnamContextValue {
  const context = useContext(TalkAnamContext);
  if (!context) {
    throw new Error("useTalkAnam must be used within TalkAnamProvider");
  }
  return context;
}

"use client";

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
  const [micMuted, setMicMuted] = useState(false);
  const [micPermission, setMicPermission] =
    useState<TalkMicPermission>("unknown");
  const [isLive, setIsLive] = useState(false);
  const [pipelineState, setPipelineState] =
    useState<TalkPipelineState>("idle");
  const stoppingIntentionallyRef = useRef(false);
  const userMutedMicRef = useRef(false);

  const registerClient = useCallback((next: AnamClient | null) => {
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
    if (!client) {
      return;
    }

    try {
      const state = client.getInputAudioState();
      setMicMuted(state.isMuted);
      userMutedMicRef.current = state.isMuted;
    } catch {
      // ignore SDK state read errors
    }
  }, [client]);

  const ensureMicActive = useCallback(() => {
    if (!client || userMutedMicRef.current) {
      return;
    }

    try {
      const state = client.getInputAudioState();
      if (state.isMuted) {
        client.unmuteInputAudio();
      }
      setMicMuted(false);
    } catch {
      // ignore SDK mic activation errors
    }
  }, [client]);

  const toggleMic = useCallback(() => {
    if (!client) {
      return;
    }

    const state = client.getInputAudioState();
    if (state.isMuted) {
      client.unmuteInputAudio();
      userMutedMicRef.current = false;
      setMicMuted(false);
    } else {
      client.muteInputAudio();
      userMutedMicRef.current = true;
      setMicMuted(true);
    }
  }, [client]);

  const stopSession = useCallback(async () => {
    const active = client;
    stoppingIntentionallyRef.current = true;
    setClient(null);
    setMicMuted(false);
    setMicPermission("unknown");
    setIsLive(false);
    setPipelineState("idle");
    userMutedMicRef.current = false;
    if (active) {
      await active.stopStreaming().catch(() => undefined);
    }
  }, [client]);

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
      setMicPermission,
      toggleMic,
      syncMicFromClient,
      ensureMicActive,
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

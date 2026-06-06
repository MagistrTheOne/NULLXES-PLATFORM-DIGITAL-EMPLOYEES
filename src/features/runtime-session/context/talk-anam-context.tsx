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

type TalkAnamContextValue = {
  registerClient: (client: AnamClient | null) => void;
  micMuted: boolean;
  toggleMic: () => void;
  stopSession: () => Promise<void>;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  isStoppingIntentionally: () => boolean;
};

const TalkAnamContext = createContext<TalkAnamContextValue | null>(null);

export function TalkAnamProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<AnamClient | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const stoppingIntentionallyRef = useRef(false);

  const registerClient = useCallback((next: AnamClient | null) => {
    if (next) {
      stoppingIntentionallyRef.current = false;
    }
    setClient(next);
    if (!next) {
      setMicMuted(false);
      setIsLive(false);
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (!client) {
      return;
    }

    const state = client.getInputAudioState();
    if (state.isMuted) {
      client.unmuteInputAudio();
      setMicMuted(false);
    } else {
      client.muteInputAudio();
      setMicMuted(true);
    }
  }, [client]);

  const stopSession = useCallback(async () => {
    const active = client;
    stoppingIntentionallyRef.current = true;
    setClient(null);
    setMicMuted(false);
    setIsLive(false);
    if (active) {
      await active.stopStreaming().catch(() => undefined);
    }
  }, [client]);

  const isStoppingIntentionally = useCallback(
    () => stoppingIntentionallyRef.current,
    [],
  );

  const value = useMemo(
    () => ({
      registerClient,
      micMuted,
      toggleMic,
      stopSession,
      isLive,
      setIsLive,
      isStoppingIntentionally,
    }),
    [
      registerClient,
      micMuted,
      toggleMic,
      stopSession,
      isLive,
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

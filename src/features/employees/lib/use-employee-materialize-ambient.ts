"use client";

import { useEffect, useRef } from "react";
import {
  EMPLOYEE_MATERIALIZE_AMBIENT_PATH,
  EMPLOYEE_MATERIALIZE_AMBIENT_VOLUME,
} from "./materialization-constants";

export function useEmployeeMaterializeAmbient(
  active: boolean,
  muted: boolean,
): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const audio = new Audio(EMPLOYEE_MATERIALIZE_AMBIENT_PATH);
    audio.loop = true;
    audio.volume = EMPLOYEE_MATERIALIZE_AMBIENT_VOLUME;
    audio.muted = muted;
    audio.preload = "none";
    audioRef.current = audio;

    void audio.play().catch(() => {
      // Placeholder asset may be missing until added to public/sounds.
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = muted;
    if (!muted && audio.paused) {
      void audio.play().catch(() => undefined);
    }
  }, [muted]);
}

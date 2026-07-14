"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const AMBIENCE_SRC = "/audio/capsules-ambience.mp3";

/**
 * Soft loop for Capsules / Inventory. Silent until the mp3 is present.
 */
export function CapsulesAmbienceToggle({ className }: { className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const audio = new Audio(AMBIENCE_SRC);
    audio.loop = true;
    audio.volume = 0.28;
    audioRef.current = audio;

    const onCanPlay = () => setAvailable(true);
    const onError = () => setAvailable(false);
    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("error", onError);
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !available) {
      return;
    }
    audio.muted = muted;
    if (!muted) {
      void audio.play().catch(() => {
        setMuted(true);
      });
    } else {
      audio.pause();
    }
  }, [available, muted]);

  return (
    <button
      type="button"
      disabled={!available}
      title={
        available
          ? muted
            ? "Unmute ambience"
            : "Mute ambience"
          : "Ambience track coming soon"
      }
      onClick={() => setMuted((value) => !value)}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {muted || !available ? (
        <VolumeX className="size-4" />
      ) : (
        <Volume2 className="size-4" />
      )}
    </button>
  );
}

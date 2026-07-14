"use client";

import type { CapsuleRevealPhase } from "./capsule-open-reveal";

/**
 * Optional SFX for open reveal.
 * Drop files under public/audio/ and set SFX_ENABLED = true.
 */
const SFX_ENABLED = false;

const SFX_SRC: Record<CapsuleRevealPhase, string> = {
  charge: "/audio/capsule-charge.mp3",
  open: "/audio/capsule-crack.mp3",
  reveal: "/audio/capsule-reveal.mp3",
};

const cache = new Map<string, HTMLAudioElement>();

function getAudio(src: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.volume = 0.45;
    cache.set(src, audio);
  }
  return audio;
}

/** Play phase SFX when enabled; no-ops / swallows missing files. */
export function playCapsuleRevealSfx(phase: CapsuleRevealPhase): void {
  if (!SFX_ENABLED) return;
  const src = SFX_SRC[phase];
  const audio = getAudio(src);
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* autoplay / missing file */
    });
  } catch {
    /* ignore */
  }
}

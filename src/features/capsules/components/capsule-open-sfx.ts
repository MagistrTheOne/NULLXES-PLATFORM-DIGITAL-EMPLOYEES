"use client";

import type { CapsuleTierId } from "@/features/rewards/lib/catalog";
import type { CapsuleRevealPhase } from "./capsule-open-reveal";

/**
 * Capsule open SFX from public/Capsules/capsul_open.
 * Paths are case-sensitive on Linux (Vercel).
 */
const SFX_ENABLED = true;

const OPEN_SFX_BY_TIER: Record<CapsuleTierId, string> = {
  daily: "/Capsules/capsul_open/base.wav",
  standard: "/Capsules/capsul_open/premium.wav",
  executive: "/Capsules/capsul_open/legendary.wav",
};

/** Soft pre-open charge uses the base crack for all tiers. */
const CHARGE_SFX = "/Capsules/capsul_open/base.wav";

const cache = new Map<string, HTMLAudioElement>();

function getAudio(src: string, volume: number): HTMLAudioElement | null {
  if (typeof window === "undefined") {
    return null;
  }

  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    cache.set(src, audio);
  }
  audio.volume = volume;
  return audio;
}

function playSrc(src: string, volume: number): void {
  const audio = getAudio(src, volume);
  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* autoplay / missing file */
    });
  } catch {
    /* ignore */
  }
}

/**
 * Play phase SFX for a capsule open reveal.
 * - charge: soft base
 * - open: tier-specific crack
 * - reveal: silent (visual only)
 */
export function playCapsuleRevealSfx(
  phase: CapsuleRevealPhase,
  tierId?: CapsuleTierId | null,
): void {
  if (!SFX_ENABLED) {
    return;
  }

  if (phase === "charge") {
    playSrc(CHARGE_SFX, 0.28);
    return;
  }

  if (phase === "open") {
    const tier = tierId ?? "daily";
    playSrc(OPEN_SFX_BY_TIER[tier], 0.5);
  }
}

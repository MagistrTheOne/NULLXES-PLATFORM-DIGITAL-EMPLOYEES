"use client";

import { useEffect, useRef } from "react";

/**
 * Short Anna voice lines when entering Capsules.
 * Paths are case-sensitive on Linux (Vercel).
 */
const ANNA_REPLICA_SRC = [
  "/Capsules/Anna_replica/Anna_replica_1.wav",
  "/Capsules/Anna_replica/Anna_replica_2.wav",
  "/Capsules/Anna_replica/Anna_replica_3.wav",
  "/Capsules/Anna_replica/Anna_replica_4.wav",
] as const;

const SESSION_KEY = "nx.capsules.anna-replica.played";
const VOLUME = 0.55;

function pickReplicaSrc(): string {
  const index = Math.floor(Math.random() * ANNA_REPLICA_SRC.length);
  return ANNA_REPLICA_SRC[index] ?? ANNA_REPLICA_SRC[0];
}

/**
 * Plays one random Anna replica once per browser tab session on mount.
 * Respects prefers-reduced-motion (skip VO). Silent on autoplay block.
 */
export function CapsulesAnnaEntrance(): null {
  const playedRef = useRef(false);

  useEffect(() => {
    if (playedRef.current) {
      return;
    }
    playedRef.current = true;

    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* private mode — still try once this mount */
    }

    const audio = new Audio(pickReplicaSrc());
    audio.volume = VOLUME;
    void audio.play().catch(() => {
      /* autoplay policy — ignore */
    });

    return () => {
      audio.pause();
    };
  }, []);

  return null;
}

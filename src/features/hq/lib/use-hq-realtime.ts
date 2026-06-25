"use client";

import { useEffect, useRef, useState } from "react";
import { refreshHqStateAction } from "../actions/refresh-hq-state";
import type { HqState } from "../types";

const POLL_INTERVAL_MS = 8_000;

/**
 * Keeps the headquarters snapshot live. Polls real DB state on an interval,
 * pausing while the tab is hidden. The transport is intentionally isolated
 * here so it can be swapped for a Stream Chat signal without touching the UI.
 */
export function useHqRealtime(initialState: HqState): HqState {
  const [state, setState] = useState<HqState>(initialState);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;

    const tick = async () => {
      if (inFlight.current || document.visibilityState === "hidden") {
        return;
      }
      inFlight.current = true;
      try {
        const next = await refreshHqStateAction();
        if (active && next) {
          setState(next);
        }
      } finally {
        inFlight.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return state;
}

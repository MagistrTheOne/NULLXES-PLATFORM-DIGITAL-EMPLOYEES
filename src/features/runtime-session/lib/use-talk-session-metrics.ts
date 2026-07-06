"use client";

import { useEffect, useState } from "react";
import type { TalkSessionMetricsSnapshot } from "@/features/runtime-session/types/talk-turn-metrics";

export function useTalkSessionMetrics(sessionId: string | null, isLive: boolean) {
  const [metrics, setMetrics] = useState<TalkSessionMetricsSnapshot | null>(null);

  useEffect(() => {
    if (!sessionId || !isLive) {
      setMetrics(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`/api/talk/sessions/${sessionId}/metrics`);
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as TalkSessionMetricsSnapshot;
        if (!cancelled) {
          setMetrics(payload);
        }
      } catch {
        // Metrics must not affect Talk UX.
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLive, sessionId]);

  return metrics;
}

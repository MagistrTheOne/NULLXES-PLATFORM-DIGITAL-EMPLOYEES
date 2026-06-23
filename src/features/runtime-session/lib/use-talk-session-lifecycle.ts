"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

const DEFAULT_HIDDEN_ABANDON_MS = 5 * 60 * 1000;

function sendSessionAbandon(sessionId: string): void {
  const body = JSON.stringify({ sessionId });
  const blob = new Blob([body], { type: "application/json" });

  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon("/api/talk/session-abandon", blob);
    return;
  }

  void fetch("/api/talk/session-abandon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

/**
 * Ends the talk session when the tab is closed, the user navigates away,
 * or the page stays hidden long enough to assume the session was abandoned.
 */
export function useTalkSessionLifecycle(
  sessionId: string | null,
  skipAbandonRef: MutableRefObject<boolean>,
  options?: { hiddenAbandonMs?: number },
): void {
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const sentRef = useRef(false);

  useEffect(() => {
    sentRef.current = false;
  }, [sessionId]);

  const abandon = useCallback(() => {
    if (skipAbandonRef.current || sentRef.current) {
      return;
    }

    const id = sessionIdRef.current;
    if (!id) {
      return;
    }

    sentRef.current = true;
    sendSessionAbandon(id);
  }, [skipAbandonRef]);

  useEffect(() => {
    const hiddenAbandonMs = options?.hiddenAbandonMs ?? DEFAULT_HIDDEN_ABANDON_MS;
    let hiddenTimer: ReturnType<typeof setTimeout> | undefined;

    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimer = setTimeout(() => abandon(), hiddenAbandonMs);
        return;
      }

      if (hiddenTimer) {
        clearTimeout(hiddenTimer);
        hiddenTimer = undefined;
      }
    };

    const onPageHide = () => abandon();

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (hiddenTimer) {
        clearTimeout(hiddenTimer);
      }
      abandon();
    };
  }, [abandon, options?.hiddenAbandonMs]);
}

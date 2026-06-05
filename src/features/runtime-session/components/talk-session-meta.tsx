"use client";

import { useEffect, useState } from "react";
import { useTalkAnam } from "../context/talk-anam-context";

function formatElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function TalkSessionMeta({
  sessionLimitSeconds,
  onLimitReached,
}: {
  sessionLimitSeconds: number;
  onLimitReached?: () => void;
}) {
  const { isLive } = useTalkAnam();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const limitReached = isLive && elapsedSeconds >= sessionLimitSeconds;

  useEffect(() => {
    if (!isLive) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    if (limitReached && onLimitReached) {
      onLimitReached();
    }
  }, [limitReached, onLimitReached]);

  const remainingSeconds = Math.max(0, sessionLimitSeconds - elapsedSeconds);

  return (
    <div className="flex shrink-0 flex-col items-end gap-1 text-sm tabular-nums">
      <div className="flex items-center gap-4">
        {isLive ? (
          <span className="flex items-center gap-2 text-white/80">
            <span className="size-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.55)]" />
            Live
          </span>
        ) : (
          <span className="text-white/40">Connecting…</span>
        )}
        <span className="text-white/55">{formatElapsed(elapsedSeconds)}</span>
      </div>
      {isLive ? (
        <span
          className={
            remainingSeconds <= 30
              ? "text-xs text-white/80"
              : "text-xs text-white/45"
          }
        >
          {formatElapsed(remainingSeconds)} remaining · limit{" "}
          {formatElapsed(sessionLimitSeconds)}
        </span>
      ) : null}
    </div>
  );
}

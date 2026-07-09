"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
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

function useIsSecureConnection(): boolean {
  const [secure, setSecure] = useState(false);

  useEffect(() => {
    setSecure(window.location.protocol === "https:");
  }, []);

  return secure;
}

/**
 * Thin status line of the Talk canvas: pipeline · model · secure · elapsed.
 * Live/secure use real signals (Anam session + HTTPS), not mock badges.
 */
export function TalkStatusBar({ modelLabel }: { modelLabel: string | null }) {
  const t = useTranslations("employees.talk");
  const { isLive, pipelineState } = useTalkAnam();
  const isSecure = useIsSecureConnection();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLive) {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isLive]);

  const stateLabel = isLive
    ? t(`stage.pipeline.${pipelineState}`)
    : t("idle");

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">
      <span className="flex items-center gap-1.5 text-white/70">
        <span
          aria-hidden
          className={cn(
            "text-sm font-semibold leading-none",
            isLive ? "text-emerald-400" : "text-red-400",
          )}
        >
          *
        </span>
        {stateLabel}
      </span>
      {modelLabel ? (
        <>
          <span className="text-white/20">·</span>
          <span className="text-white/55">{modelLabel}</span>
        </>
      ) : null}
      <span className="text-white/20">·</span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn(
            "text-sm font-semibold leading-none",
            isSecure ? "text-emerald-400" : "text-red-400",
          )}
        >
          *
        </span>
        {isSecure ? t("statusSecure") : t("statusInsecure")}
      </span>
      {isLive ? (
        <>
          <span className="text-white/20">·</span>
          <span className="tabular-nums text-white/55">
            {formatElapsed(elapsed)}
          </span>
        </>
      ) : null}
    </div>
  );
}

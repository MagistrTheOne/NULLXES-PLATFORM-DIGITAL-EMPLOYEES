"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
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

/**
 * The signature thin status line of the Talk canvas, sitting between the video
 * stage and the conversation: pipeline state · model · secure · elapsed.
 */
export function TalkStatusBar({ modelLabel }: { modelLabel: string | null }) {
  const t = useTranslations("employees.talk");
  const { isLive, pipelineState } = useTalkAnam();
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
  const speaking = isLive && pipelineState === "speaking";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">
      <span className="flex items-center gap-1.5 text-white/70">
        <span
          className={cn(
            "size-1.5 rounded-full",
            speaking
              ? "bg-emerald-400"
              : isLive
                ? "bg-emerald-400/60"
                : "bg-white/30",
          )}
        />
        {stateLabel}
      </span>
      {modelLabel ? (
        <>
          <span className="text-white/20">·</span>
          <span className="text-white/55">{modelLabel}</span>
        </>
      ) : null}
      <span className="text-white/20">·</span>
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="size-3 stroke-[1.5]" aria-hidden />
        {t("statusSecure")}
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

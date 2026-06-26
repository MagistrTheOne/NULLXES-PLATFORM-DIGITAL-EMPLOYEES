"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTalkAnam } from "../context/talk-anam-context";

const ANAM_VIDEO_ELEMENT_ID = "nullxes-anam-persona-video";

function SpeakingWaveform({ active }: { active: boolean }) {
  return (
    <span className="flex h-3 items-end gap-0.5" aria-hidden>
      {[0.45, 0.85, 0.6, 1].map((scale, index) => (
        <span
          key={index}
          className={cn(
            "w-0.5 rounded-full bg-emerald-400",
            active && "animate-pulse",
          )}
          style={{ height: `${scale * 100}%` }}
        />
      ))}
    </span>
  );
}

export function TalkStageChrome({ employeeName }: { employeeName: string }) {
  const t = useTranslations("employees.talk.stage");
  const { isLive, pipelineState } = useTalkAnam();

  const handleFullscreen = useCallback(() => {
    const video = document.getElementById(ANAM_VIDEO_ELEMENT_ID);
    if (!video) {
      return;
    }
    void (
      video.requestFullscreen?.() ??
      (video as HTMLVideoElement & { webkitRequestFullscreen?: () => void })
        .webkitRequestFullscreen?.()
    );
  }, []);

  const speaking = isLive && pipelineState === "speaking";
  const stateLabel = isLive
    ? t(`pipeline.${pipelineState}`)
    : employeeName.toUpperCase();

  return (
    <>
      <div className="pointer-events-none absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white/85 uppercase backdrop-blur-sm">
        <SpeakingWaveform active={speaking || (isLive && pipelineState === "listening")} />
        <span>
          {employeeName.toUpperCase()}
          {isLive ? ` · ${stateLabel}` : ""}
        </span>
      </div>

      {isLive ? (
        <div className="absolute right-3 bottom-[4.5rem] z-20 lg:bottom-3">
          <button
            type="button"
            aria-label={t("fullscreen")}
            onClick={handleFullscreen}
            className="flex size-8 items-center justify-center rounded-lg border border-white/12 bg-black/65 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            <Expand className="size-3.5 stroke-[1.5]" />
          </button>
        </div>
      ) : null}
    </>
  );
}

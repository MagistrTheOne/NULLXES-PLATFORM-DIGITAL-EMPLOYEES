"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  AudioLines,
  Expand,
  Loader2,
  Mic,
  Radio,
  Signal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTalkAnam } from "../context/talk-anam-context";
import type { TalkPipelineState } from "../context/talk-anam-context";

const ANAM_VIDEO_ELEMENT_ID = "nullxes-anam-persona-video";

const PIPELINE_STATE_ICONS: Record<
  TalkPipelineState,
  { Icon: typeof Mic; spin?: boolean; dim?: boolean }
> = {
  idle: { Icon: Radio, dim: true },
  listening: { Icon: Mic },
  thinking: { Icon: Loader2, spin: true },
  speaking: { Icon: AudioLines },
};

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

  const { Icon: StateIcon, spin, dim } = PIPELINE_STATE_ICONS[pipelineState];

  return (
    <>
      <div className="pointer-events-none absolute top-3 left-3 z-20 rounded-full border border-white/10 bg-black/65 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white/80 uppercase">
        {employeeName}
      </div>

      {isLive ? (
        <>
          <div className="pointer-events-none absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[11px] text-white/75">
            <StateIcon
              className={cn(
                "size-3.5 stroke-[1.5]",
                spin && "animate-spin",
                dim ? "text-white/45" : "text-white",
              )}
              aria-hidden
            />
            {t(`pipeline.${pipelineState}`)}
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[11px] text-white/70">
            <Signal className="size-3.5 stroke-[1.5]" />
            {t("goodConnection")}
          </div>
          <div className="absolute right-3 bottom-3 z-20 flex items-center gap-2">
            <span className="hidden rounded-full border border-white/10 bg-black/65 px-2 py-0.5 text-[10px] text-white/55 sm:inline">
              720p
            </span>
            <button
              type="button"
              aria-label={t("fullscreen")}
              onClick={handleFullscreen}
              className="flex size-8 items-center justify-center rounded-full border border-white/12 bg-black/65 text-white/80 transition-colors hover:bg-white/10"
            >
              <Expand className="size-3.5 stroke-[1.5]" />
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

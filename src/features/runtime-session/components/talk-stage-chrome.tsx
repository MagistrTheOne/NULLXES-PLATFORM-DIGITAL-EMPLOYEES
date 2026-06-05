"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Expand, Signal } from "lucide-react";
import { useTalkAnam } from "../context/talk-anam-context";

const ANAM_VIDEO_ELEMENT_ID = "nullxes-anam-persona-video";

export function TalkStageChrome({ employeeName }: { employeeName: string }) {
  const t = useTranslations("employees.talk.stage");
  const { isLive } = useTalkAnam();

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

  return (
    <>
      <div className="pointer-events-none absolute top-3 left-3 z-20 rounded-full border border-white/10 bg-black/65 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white/80 uppercase">
        {employeeName}
      </div>

      {isLive ? (
        <>
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[11px] text-white/70">
            <Signal className="size-3.5 stroke-[1.5]" />
            {t("goodConnection")}
          </div>
          <div className="absolute right-3 bottom-3 z-20 flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/65 px-2 py-0.5 text-[10px] text-white/55">
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

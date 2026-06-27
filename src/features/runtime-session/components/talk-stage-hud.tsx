"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Expand, Signal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTalkAnam } from "../context/talk-anam-context";

const ANAM_VIDEO_ELEMENT_ID = "nullxes-anam-persona-video";

function Sparkline({ seed, className }: { seed: number; className?: string }) {
  const points = useMemo(() => {
    const values: number[] = [];
    let value = 0.35 + (seed % 7) * 0.04;
    for (let index = 0; index < 12; index += 1) {
      value += Math.sin(seed * 0.7 + index * 0.9) * 0.08;
      value = Math.min(0.92, Math.max(0.12, value));
      values.push(value);
    }
    return values;
  }, [seed]);

  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = (1 - value) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("h-8 w-full opacity-70", className)}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function AudioBars({ active, level }: { active: boolean; level: number }) {
  const scales = [0.35, 0.55, 0.75, 0.95, 0.65, 0.85, 0.45].map(
    (base, index) =>
      base * (active ? 0.55 + level * 0.45 * (index % 2 ? 1.1 : 0.9) : 0.25),
  );

  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden>
      {scales.map((scale, index) => (
        <span
          key={index}
          className={cn(
            "w-0.5 rounded-full bg-white/80 transition-all duration-150",
            active && "animate-pulse",
          )}
          style={{ height: `${scale * 100}%` }}
        />
      ))}
    </span>
  );
}

function HudRing() {
  return (
    <svg viewBox="0 0 48 48" className="size-11 text-white/35" aria-hidden>
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <circle
        cx="24"
        cy="24"
        r="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function TalkStageHud({ employeeName }: { employeeName: string }) {
  const t = useTranslations("employees.talk.stage");
  const { isLive, pipelineState } = useTalkAnam();
  const [speakingLevel, setSpeakingLevel] = useState(72);

  const speaking = isLive && pipelineState === "speaking";
  const listening = isLive && pipelineState === "listening";

  useEffect(() => {
    if (!speaking) {
      setSpeakingLevel(listening ? 38 : 0);
      return;
    }

    const interval = window.setInterval(() => {
      setSpeakingLevel((current) => {
        const next = current + (Math.random() - 0.5) * 14;
        return Math.round(Math.min(92, Math.max(58, next)));
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [listening, speaking]);

  const handleFullscreen = () => {
    const video = document.getElementById(ANAM_VIDEO_ELEMENT_ID);
    if (!video) {
      return;
    }
    void (
      video.requestFullscreen?.() ??
      (video as HTMLVideoElement & { webkitRequestFullscreen?: () => void })
        .webkitRequestFullscreen?.()
    );
  };

  const stateLabel = isLive
    ? t(`pipeline.${pipelineState}`)
    : employeeName.toUpperCase();

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-white/90 uppercase">
            NULLXES
          </p>
          <p className="text-[9px] tracking-[0.22em] text-white/45 uppercase">
            {t("tagline")}
          </p>
        </div>

        <div className="hidden items-start gap-3 sm:flex">
          <div className="space-y-1 text-right">
            <p className="text-[9px] tracking-[0.18em] text-white/35 uppercase">
              {t("hudEvolutionary")}
            </p>
            <p className="text-[9px] tracking-[0.18em] text-white/35 uppercase">
              {t("hudQuantum")}
            </p>
          </div>
          <HudRing />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-3 rounded-xl border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-sm">
        <AudioBars active={speaking || listening} level={speakingLevel / 100} />
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-white/90">
            {isLive ? stateLabel : employeeName}
            {speaking ? (
              <span className="text-white/55"> · {speakingLevel}%</span>
            ) : null}
          </p>
          {isLive && !speaking ? (
            <p className="text-[10px] text-white/45">{employeeName}</p>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 z-20 flex items-center gap-2 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 text-[10px] font-medium tracking-wide text-white/75 backdrop-blur-sm">
        <span>1080p HD</span>
        <Signal className="size-3.5 stroke-[1.5] text-white/60" aria-hidden />
      </div>

      {isLive ? (
        <div className="absolute top-4 right-4 z-20 sm:hidden">
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

      <div className="pointer-events-none absolute right-4 bottom-14 hidden sm:block">
        <Sparkline seed={employeeName.length * 11} className="w-24 text-white/25" />
      </div>
    </>
  );
}

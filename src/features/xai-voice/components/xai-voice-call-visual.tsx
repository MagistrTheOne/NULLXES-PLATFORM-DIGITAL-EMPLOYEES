"use client";

import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type WaveBar = {
  height: number;
  width: number;
  duration: number;
  delay: number;
};

const STAGE_WAVE_BARS: WaveBar[] = [
  { height: 0.22, width: 1, duration: 1.15, delay: 0 },
  { height: 0.38, width: 2, duration: 0.82, delay: 40 },
  { height: 0.52, width: 1, duration: 1.35, delay: 90 },
  { height: 0.68, width: 3, duration: 0.95, delay: 20 },
  { height: 0.84, width: 2, duration: 1.05, delay: 130 },
  { height: 1, width: 2, duration: 0.78, delay: 60 },
  { height: 0.76, width: 1, duration: 1.22, delay: 170 },
  { height: 0.58, width: 3, duration: 0.88, delay: 110 },
  { height: 0.42, width: 1, duration: 1.4, delay: 30 },
  { height: 0.3, width: 2, duration: 0.92, delay: 150 },
  { height: 0.48, width: 1, duration: 1.08, delay: 80 },
  { height: 0.64, width: 2, duration: 0.86, delay: 200 },
  { height: 0.8, width: 3, duration: 1.18, delay: 50 },
  { height: 0.56, width: 1, duration: 0.98, delay: 140 },
  { height: 0.36, width: 2, duration: 1.28, delay: 100 },
  { height: 0.26, width: 1, duration: 0.9, delay: 180 },
];

const COMPACT_WAVE_BARS: WaveBar[] = STAGE_WAVE_BARS.slice(0, 10);

function WaveformLane({
  active,
  large,
  mirrored = false,
}: {
  active: boolean;
  large: boolean;
  mirrored?: boolean;
}) {
  const bars = large ? STAGE_WAVE_BARS : COMPACT_WAVE_BARS;
  const scale = large ? 36 : 24;

  return (
    <div
      className={cn(
        "flex w-full items-center",
        large ? "justify-between gap-[2px] sm:gap-1" : "justify-center gap-[3px]",
        mirrored && "flex-row-reverse",
      )}
      aria-hidden
    >
      {bars.map((bar, index) => (
        <span
          key={index}
          className={cn(
            "shrink rounded-full bg-white/20 transition-opacity duration-500",
            active && "animate-xai-voice-bar bg-white/50",
            !active && "opacity-70",
          )}
          style={{
            width: `${bar.width}px`,
            height: `${Math.max(6, Math.round(bar.height * scale))}px`,
            animationDuration: active ? `${bar.duration}s` : undefined,
            animationDelay: active ? `${bar.delay}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function XaiVoiceCallVisual({
  name,
  avatarPreviewUrl,
  speaking,
  variant = "compact",
}: {
  name: string;
  avatarPreviewUrl?: string | null;
  speaking: boolean;
  variant?: "compact" | "stage";
}) {
  const isStage = variant === "stage";
  const avatarSize = isStage
    ? "size-52 sm:size-60 md:size-64"
    : "size-24 sm:size-28";

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center",
        isStage ? "max-w-5xl gap-3 px-2 sm:gap-5 md:gap-6" : "gap-4 py-2",
      )}
    >
      <div
        className={cn(
          "hidden min-w-0 sm:flex",
          isStage ? "flex-1 basis-0 justify-end" : "flex-1 justify-end",
        )}
      >
        <WaveformLane active={speaking} large={isStage} mirrored />
      </div>

      <div className="relative shrink-0">
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#0d0d0d]",
            "shadow-[0_0_60px_rgba(255,255,255,0.04)]",
            speaking && "animate-xai-voice-shadow-breathe",
            avatarSize,
          )}
        >
          {avatarPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreviewUrl}
              alt={name}
              className="size-full object-cover"
            />
          ) : (
            <UserRound
              className={cn(
                "text-white/35",
                isStage ? "size-20 sm:size-24" : "size-10",
              )}
            />
          )}
        </div>

        {isStage ? (
          <div
            aria-hidden
            className="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 h-10 w-[68%] -translate-x-1/2 overflow-hidden opacity-[0.14] blur-md sm:h-12"
          >
            {avatarPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreviewUrl}
                alt=""
                className="size-full scale-y-[-1] object-cover object-top"
              />
            ) : (
              <div className="mx-auto size-16 rounded-full bg-white/20" />
            )}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "hidden min-w-0 sm:flex",
          isStage ? "flex-1 basis-0 justify-start" : "flex-1 justify-start",
        )}
      >
        <WaveformLane active={speaking} large={isStage} />
      </div>

      <div className="flex w-full justify-center sm:hidden">
        <WaveformLane active={speaking} large={isStage} />
      </div>
    </div>
  );
}

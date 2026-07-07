"use client";

import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

function WaveformBars({ active }: { active: boolean }) {
  const heights = [0.35, 0.55, 0.75, 1, 0.8, 0.6, 0.45, 0.7, 0.9, 0.5, 0.65, 0.4];

  return (
    <div className="flex items-center justify-center gap-[3px]" aria-hidden>
      {heights.map((height, index) => (
        <span
          key={index}
          className={cn(
            "w-[3px] rounded-full bg-white/25 transition-all duration-300",
            active && "animate-xai-voice-bar bg-white/55",
          )}
          style={{
            height: `${Math.round(height * 28)}px`,
            animationDelay: active ? `${index * 70}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function XaiVoiceCallVisual({
  name,
  avatarPreviewUrl,
  active,
  connected,
}: {
  name: string;
  avatarPreviewUrl?: string | null;
  active: boolean;
  connected: boolean;
}) {
  return (
    <div className="relative flex w-full items-center justify-center gap-4 py-2">
      <div className="hidden min-w-0 flex-1 sm:flex sm:justify-end">
        <WaveformBars active={active} />
      </div>

      <div className="relative shrink-0">
        <div
          className={cn(
            "absolute -inset-3 rounded-full border border-dashed transition-colors",
            connected
              ? "border-emerald-400/35 animate-pulse"
              : "border-white/15",
          )}
        />
        <div
          className={cn(
            "absolute -inset-1.5 rounded-full bg-white/5 blur-md transition-opacity",
            active ? "opacity-100" : "opacity-40",
          )}
        />
        <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#111111] shadow-[0_0_40px_rgba(255,255,255,0.06)] sm:size-28">
          {avatarPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreviewUrl}
              alt={name}
              className="size-full object-cover"
            />
          ) : (
            <UserRound className="size-10 text-white/35" />
          )}
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 sm:flex sm:justify-start">
        <WaveformBars active={active} />
      </div>

      <div className="flex flex-1 justify-center sm:hidden">
        <WaveformBars active={active} />
      </div>
    </div>
  );
}

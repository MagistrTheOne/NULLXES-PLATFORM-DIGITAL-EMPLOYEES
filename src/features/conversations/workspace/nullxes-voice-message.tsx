"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoiceAttachment = {
  asset_url?: string;
  duration?: number;
  mime_type?: string;
  waveform_data?: number[];
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function NullxesVoiceMessage({
  attachment,
  transcript,
  compact,
}: {
  attachment: VoiceAttachment;
  transcript?: string;
  compact?: boolean;
}) {
  const t = useTranslations("conversations.voice");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const bars = useMemo(() => {
    const data = attachment.waveform_data;
    if (!data?.length) {
      return Array.from({ length: 24 }, (_, index) => 0.25 + (index % 5) * 0.08);
    }

    const step = Math.max(1, Math.floor(data.length / 24));
    return Array.from({ length: 24 }, (_, index) => {
      const sample = data[index * step] ?? 0;
      return Math.max(0.12, Math.min(1, sample));
    });
  }, [attachment.waveform_data]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    // We intentionally do not use `void` to ignore rejections.
    // Handle the promise so that failures (autoplay policy, load errors,
    // unsupported format, etc.) do not cause unhandled rejections and do
    // not leave the play button in a broken state.
    audio.play().catch((error) => {
      setPlaying(false);
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Voice message playback failed to start', error);
      }
    });
  };

  return (
    <div className={cn("space-y-2", compact ? "mt-1" : "mt-0")}>
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/2 px-3 py-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={togglePlayback}
          disabled={!attachment.asset_url}
          className="size-8 shrink-0 rounded-full bg-white text-black hover:bg-white/90"
          aria-label={playing ? t("pause") : t("play")}
        >
          {playing ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
        </Button>

        <div className="flex min-w-0 flex-1 items-end gap-0.5">
          {bars.map((height, index) => (
            <span
              key={index}
              className="w-1 rounded-full bg-white/35"
              style={{ height: `${Math.round(height * 20 + 4)}px` }}
            />
          ))}
        </div>

        <span className="shrink-0 text-[10px] tabular-nums text-white/35">
          {formatDuration(attachment.duration ?? 0)}
        </span>

        {attachment.asset_url ? (
          <audio
            ref={audioRef}
            src={attachment.asset_url}
            preload="metadata"
            onPlay={() => {
              setPlaying(true);
            }}
            onEnded={() => {
              setPlaying(false);
            }}
            onPause={() => {
              setPlaying(false);
            }}
            onError={() => {
              setPlaying(false);
            }}
            className="hidden"
          >
            <track kind="captions" />
          </audio>
        ) : null}
      </div>

      {transcript ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
          {transcript}
        </p>
      ) : null}
    </div>
  );
}
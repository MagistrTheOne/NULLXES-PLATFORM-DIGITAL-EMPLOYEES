"use client";

import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StudioVoiceOption } from "./voice-catalog";

export function VoiceCard({
  voice,
  selected,
  isPreviewing,
  onSelect,
  onPreview,
}: {
  voice: StudioVoiceOption;
  selected: boolean;
  isPreviewing: boolean;
  onSelect: () => void;
  onPreview?: () => void;
}) {
  const canPreview = voice.provider === "ElevenLabs" && Boolean(onPreview);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-[#111111] p-4 transition-colors",
        selected ? "border-white/30" : "border-white/10 hover:border-white/20",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-col gap-2 text-start"
      >
        <h3 className="text-base font-medium text-white">{voice.name}</h3>
        <div className="flex flex-col gap-1 text-xs text-white/50">
          <span>Gender: {voice.gender}</span>
          <span>Language: {voice.language}</span>
          <span>Provider: {voice.provider}</span>
        </div>
      </button>
      {canPreview ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPreviewing}
          onClick={(event) => {
            event.stopPropagation();
            onPreview?.();
          }}
          className="border-white/10 bg-transparent text-white hover:bg-white/5"
        >
          {isPreviewing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          Preview
        </Button>
      ) : (
        <p className="text-xs text-white/40">
          Voice for avatar.
        </p>
      )}
    </div>
  );
}

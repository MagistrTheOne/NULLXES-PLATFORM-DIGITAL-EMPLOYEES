"use client";

import { STUDIO_VOICES } from "./voice-catalog";
import { VoiceCard } from "./voice-card";
import type { StudioVoiceProvider } from "./voice-catalog";

export function VoiceStudioGrid({
  selectedVoiceId,
  previewingVoiceId,
  onSelectVoice,
  onPreviewVoice,
}: {
  selectedVoiceId: string | null;
  previewingVoiceId: string | null;
  onSelectVoice: (input: {
    studioVoiceId: string;
    voiceName: string;
    provider: StudioVoiceProvider;
  }) => void;
  onPreviewVoice: (elevenLabsVoiceId: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {STUDIO_VOICES.map((voice) => (
        <VoiceCard
          key={voice.id}
          voice={voice}
          selected={selectedVoiceId === voice.id}
          isPreviewing={
            voice.provider === "ElevenLabs" &&
            previewingVoiceId === voice.elevenLabsVoiceId
          }
          onSelect={() =>
            onSelectVoice({
              studioVoiceId: voice.id,
              voiceName: voice.name,
              provider: voice.provider,
            })
          }
          onPreview={
            voice.provider === "ElevenLabs" && voice.elevenLabsVoiceId
              ? () => onPreviewVoice(voice.elevenLabsVoiceId!)
              : undefined
          }
        />
      ))}
    </div>
  );
}

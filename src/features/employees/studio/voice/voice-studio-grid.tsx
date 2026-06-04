"use client";

import { ELEVENLABS_STUDIO_VOICES } from "./voice-catalog";
import { VoiceCard } from "./voice-card";

export function VoiceStudioGrid({
  selectedVoiceId,
  previewingVoiceId,
  onSelectVoice,
  onPreviewVoice,
}: {
  selectedVoiceId: string | null;
  previewingVoiceId: string | null;
  onSelectVoice: (voiceId: string, voiceName: string) => void;
  onPreviewVoice: (voiceId: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ELEVENLABS_STUDIO_VOICES.map((voice) => (
        <VoiceCard
          key={voice.voiceId}
          voice={voice}
          selected={selectedVoiceId === voice.voiceId}
          isPreviewing={previewingVoiceId === voice.voiceId}
          onSelect={() => onSelectVoice(voice.voiceId, voice.name)}
          onPreview={() => onPreviewVoice(voice.voiceId)}
        />
      ))}
    </div>
  );
}

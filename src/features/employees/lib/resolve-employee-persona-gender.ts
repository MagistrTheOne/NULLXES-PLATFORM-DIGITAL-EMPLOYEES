import { getStudioVoiceById } from "@/features/employees/studio/voice/voice-catalog";
import { resolveCharacterGender } from "@/features/hq/lib/resolve-character-gender";

export type PersonaGender = "female" | "male" | "neutral";

export function resolveEmployeePersonaGender(input: {
  name?: string;
  studioVoiceId: string | null;
  voiceId: string | null;
}): PersonaGender {
  if (!input.studioVoiceId) {
    return input.name ? resolveCharacterGender(input.name) : "neutral";
  }

  const voice = getStudioVoiceById(
    input.studioVoiceId,
    input.voiceId ?? undefined,
  );
  if (!voice) {
    return input.name ? resolveCharacterGender(input.name) : "neutral";
  }

  const normalizedGender = voice.gender.trim().toLowerCase();
  if (normalizedGender === "female") {
    return "female";
  }
  if (normalizedGender === "male") {
    return "male";
  }

  return input.name ? resolveCharacterGender(input.name) : "neutral";
}

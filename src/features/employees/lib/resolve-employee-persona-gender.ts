import { getStudioVoiceById } from "@/features/employees/studio/voice/voice-catalog";

export type PersonaGender = "female" | "male" | "neutral";

export function resolveEmployeePersonaGender(input: {
  studioVoiceId: string | null;
  voiceId: string | null;
}): PersonaGender {
  if (!input.studioVoiceId) {
    return "neutral";
  }

  const voice = getStudioVoiceById(
    input.studioVoiceId,
    input.voiceId ?? undefined,
  );
  if (!voice) {
    return "neutral";
  }

  const normalizedGender = voice.gender.trim().toLowerCase();
  if (normalizedGender === "female") {
    return "female";
  }
  if (normalizedGender === "male") {
    return "male";
  }

  return "neutral";
}

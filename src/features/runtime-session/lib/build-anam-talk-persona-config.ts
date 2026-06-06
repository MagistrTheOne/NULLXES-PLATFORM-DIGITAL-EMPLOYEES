import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";

/** Anam-side prompt when brain is handled by NULLXES OpenAI (avatar + TTS only). */
export const ANAM_AVATAR_ONLY_SYSTEM_PROMPT =
  "Avatar-only persona. All conversation logic is handled by the NULLXES client brain.";

export function buildAnamTalkSessionPersonaConfig(input: {
  personaId: string;
  enableAudioPassthrough?: boolean;
}): Record<string, unknown> {
  return {
    personaId: input.personaId,
    llmId: ANAM_EXTERNAL_LLM_ID,
    skipGreeting: true,
    ...(input.enableAudioPassthrough ? { enableAudioPassthrough: true } : {}),
  };
}

export function buildAnamPersonaExternalBrainPayload(): Record<string, unknown> {
  return {
    llmId: ANAM_EXTERNAL_LLM_ID,
    skipGreeting: true,
    systemPrompt: ANAM_AVATAR_ONLY_SYSTEM_PROMPT,
  };
}

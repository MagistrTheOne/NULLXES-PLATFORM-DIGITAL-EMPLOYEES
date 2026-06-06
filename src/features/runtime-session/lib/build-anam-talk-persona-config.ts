import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";

/** Anam-side prompt when brain is handled by NULLXES OpenAI (avatar + TTS only). */
export const ANAM_AVATAR_ONLY_SYSTEM_PROMPT =
  "Avatar-only persona. All conversation logic is handled by the NULLXES client brain.";

/**
 * Ephemeral persona config for session tokens.
 * Per Anam API, personaConfig is oneOf: either personaId alone (stateful) OR
 * avatarId/voiceId/llmId at runtime. Mixing personaId with llmId is ignored.
 * @see https://anam.ai/docs/api-reference/sessions/create-session-token
 * @see https://anam.ai/docs/javascript-sdk/examples/custom-llm
 */
export function buildAnamTalkEphemeralPersonaConfig(input: {
  name: string;
  avatarId: string;
  voiceId: string;
  enableAudioPassthrough?: boolean;
}): Record<string, unknown> {
  return {
    name: input.name,
    avatarId: input.avatarId,
    voiceId: input.voiceId,
    llmId: ANAM_EXTERNAL_LLM_ID,
    skipGreeting: true,
    systemPrompt: ANAM_AVATAR_ONLY_SYSTEM_PROMPT,
    languageCode: "ru",
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

/** POST /personas — avatar + voice shell; brain is NULLXES OpenAI at talk time. */
export function buildAnamPersonaCreatePayload(input: {
  name: string;
  avatarId: string;
  voiceId: string;
}): Record<string, unknown> {
  return {
    name: input.name,
    description: `${input.name} NULLXES digital employee persona`,
    avatarId: input.avatarId,
    voiceId: input.voiceId,
    ...buildAnamPersonaExternalBrainPayload(),
  };
}

import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";

 
export const ANAM_AVATAR_ONLY_SYSTEM_PROMPT =
  "Avatar-only persona. All conversation logic is handled by the NULLXES client brain.";

 
export function buildAnamTalkEphemeralPersonaConfig(input: {
  name: string;
  avatarId: string;
  voiceId: string;
  languageCode?: string;
  enableAudioPassthrough?: boolean;
}): Record<string, unknown> {
  return {
    name: input.name,
    avatarId: input.avatarId,
    voiceId: input.voiceId,
    llmId: ANAM_EXTERNAL_LLM_ID,
    skipGreeting: true,
    systemPrompt: ANAM_AVATAR_ONLY_SYSTEM_PROMPT,
    languageCode: input.languageCode ?? "en",
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
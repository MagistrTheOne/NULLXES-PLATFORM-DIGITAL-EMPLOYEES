import {
  NULLXES_CONVERSATION_START_POLICY,
  NULLXES_GLOBAL_SYSTEM_PROMPT,
  NULLXES_LANGUAGE_POLICY_RU,
  NULLXES_MISSION_STATUS_POLICY,
  composeTalkSystemPrompt,
} from "@/features/employees/lib/build-system-prompt";

const XAI_VOICE_DELIVERY_POLICY = `Voice call delivery (Grok Voice):
- You are on a live voice call. Keep answers short, spoken, and conversational — usually one to three sentences unless the user asks for detail.
- Do not use markdown, bullet lists, or code blocks in speech.
- Pause naturally; avoid long monologues.
- When mission or platform data is needed, call the appropriate tool before answering.`;

/** Default Grok voice instructions for NULLXES-managed agents (no xAI console agent). */
export function composeDefaultXaiVoiceSystemPrompt(input: {
  name: string;
  role: string;
  storedPrompt: string;
  personaGender?: "female" | "male" | "neutral";
}): string {
  const talkPrompt = composeTalkSystemPrompt(input);

  return [talkPrompt, XAI_VOICE_DELIVERY_POLICY, NULLXES_LANGUAGE_POLICY_RU]
    .filter(Boolean)
    .join("\n\n");
}

/** Lightweight fallback when only identity fields are known (e.g. early create). */
export function composeSeedXaiVoiceSystemPrompt(name: string, role: string): string {
  return [
    NULLXES_GLOBAL_SYSTEM_PROMPT,
    `You are ${name.trim()}, ${role.trim()} at NULLXES.`,
    NULLXES_CONVERSATION_START_POLICY,
    NULLXES_MISSION_STATUS_POLICY,
    XAI_VOICE_DELIVERY_POLICY,
    NULLXES_LANGUAGE_POLICY_RU,
  ].join("\n\n");
}

import {
  getAnamApiBaseUrl,
  getAnamApiKey,
} from "@/shared/config/provider-env";
import type { StudioVoiceOption } from "./voice/voice-catalog";

type AnamListResponse<T> = {
  data?: T[];
};

export async function fetchDefaultAnamShellVoiceId(): Promise<string> {
  const apiKey = getAnamApiKey();
  if (!apiKey) {
    throw new Error("ANAM_API_KEY is not configured");
  }

  const response = await fetch(`${getAnamApiBaseUrl()}/voices?perPage=1`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Anam voices request failed with status ${response.status}`);
  }

  const voices = (await response.json()) as AnamListResponse<{ id: string }>;
  const voiceId = voices.data?.[0]?.id;
  if (!voiceId) {
    throw new Error("Anam voice catalog returned no voices");
  }

  return voiceId;
}

/**
 * Persona uses Anam voice only. When the user picks ElevenLabs, bind a neutral
 * Anam shell voice so the custom ElevenLabs voice is not overridden in session config.
 */
export async function resolveAnamPersonaVoiceId(
  selectedVoice: StudioVoiceOption,
): Promise<{ anamVoiceId: string; binding: "anam" | "elevenlabs_shell" }> {
  if (selectedVoice.provider === "Anam" && selectedVoice.anamVoiceId) {
    return { anamVoiceId: selectedVoice.anamVoiceId, binding: "anam" };
  }

  const shellVoiceId = await fetchDefaultAnamShellVoiceId();
  return { anamVoiceId: shellVoiceId, binding: "elevenlabs_shell" };
}

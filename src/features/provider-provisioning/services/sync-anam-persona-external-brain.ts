import {
  ANAM_AVATAR_ONLY_SYSTEM_PROMPT,
  buildAnamPersonaExternalBrainPayload,
} from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import { ANAM_EXTERNAL_LLM_ID } from "../types";
import { getAnamApiBaseUrl, getAnamApiKey } from "@/shared/config/provider-env";

type AnamPersonaSnapshot = {
  llmId?: string | null;
  skipGreeting?: boolean;
  systemPrompt?: string | null;
};

export async function syncAnamPersonaExternalBrain(
  personaId: string,
): Promise<void> {
  const apiKey = getAnamApiKey();
  if (!apiKey) {
    return;
  }

  const baseUrl = getAnamApiBaseUrl();
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  let current: AnamPersonaSnapshot | null = null;
  try {
    const response = await fetch(`${baseUrl}/personas/${personaId}`, {
      headers,
    });
    if (response.ok) {
      current = (await response.json()) as AnamPersonaSnapshot;
    }
  } catch {
    // Best-effort read; still attempt update below.
  }

  const alreadySynced =
    current?.llmId === ANAM_EXTERNAL_LLM_ID &&
    current?.skipGreeting === true &&
    current?.systemPrompt === ANAM_AVATAR_ONLY_SYSTEM_PROMPT;

  if (alreadySynced) {
    return;
  }

  const updateResponse = await fetch(`${baseUrl}/personas/${personaId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(buildAnamPersonaExternalBrainPayload()),
  });

  if (!updateResponse.ok) {
    console.warn(
      `Anam persona ${personaId} external-brain sync failed (${updateResponse.status})`,
    );
  }
}

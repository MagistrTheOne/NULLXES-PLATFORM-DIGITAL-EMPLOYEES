import {
  ANAM_AVATAR_ONLY_SYSTEM_PROMPT,
  buildAnamPersonaExternalBrainPayload,
} from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import { ANAM_EXTERNAL_LLM_ID } from "../types";
import { mergeProviderConfig, getProviderConfigRow } from "./update-provider-config";
import { getAnamApiBaseUrl, getAnamApiKeyBySlot } from "@/shared/config/provider-env";

type AnamPersonaSnapshot = {
  llmId?: string | null;
  skipGreeting?: boolean;
  systemPrompt?: string | null;
};

async function resolveStoredAnamApiKeySlot(
  employeeId: string,
): Promise<string | null> {
  try {
    const row = await getProviderConfigRow(employeeId, "avatar");
    const metadata =
      row?.config &&
      typeof row.config === "object" &&
      row.config !== null &&
      "providerMetadata" in row.config &&
      typeof (row.config as { providerMetadata?: unknown }).providerMetadata ===
        "object"
        ? ((row.config as { providerMetadata: Record<string, unknown> })
            .providerMetadata ?? {})
        : {};

    return typeof metadata.anamApiKeySlot === "string" ? metadata.anamApiKeySlot : null;
  } catch {
    return null;
  }
}

export async function syncAnamPersonaExternalBrain(input: {
  personaId: string;
  employeeId?: string;
  anamApiKeySlot?: string | null;
}): Promise<void> {
  const { personaId, employeeId, anamApiKeySlot } = input;
  const apiKey = getAnamApiKeyBySlot(
    anamApiKeySlot ??
      (employeeId
        ? await resolveStoredAnamApiKeySlot(employeeId)
        : null),
  );
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

  if (!alreadySynced) {
    const updateResponse = await fetch(`${baseUrl}/personas/${personaId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(buildAnamPersonaExternalBrainPayload()),
    });

    if (!updateResponse.ok) {
      return;
    }
  }

  if (!employeeId) {
    return;
  }

  try {
    const row = await getProviderConfigRow(employeeId, "avatar");
    const existingMetadata =
      row?.config &&
      typeof row.config === "object" &&
      row.config !== null &&
      "providerMetadata" in row.config &&
      typeof (row.config as { providerMetadata?: unknown }).providerMetadata ===
        "object"
        ? ((row.config as { providerMetadata: Record<string, unknown> })
            .providerMetadata ?? {})
        : {};

    await mergeProviderConfig(employeeId, "avatar", {
      providerMetadata: {
        ...existingMetadata,
        externalBrainSyncedAt: new Date().toISOString(),
        externalBrainLlmId: ANAM_EXTERNAL_LLM_ID,
      },
    });
  } catch {
    // Best-effort metadata persistence; talk start can retry sync later.
  }
}

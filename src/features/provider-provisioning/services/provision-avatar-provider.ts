import type { AvatarProviderConfigPayload } from "@/entities/provider-config";
import {
  getAnamApiBaseUrl,
  getAnamApiKey,
  hasAnamCredentials,
} from "@/shared/config/provider-env";
import { resolveAvatarProvider } from "@/shared/providers";
import type {
  ProvisionAvatarProviderInput,
  ProvisionProviderResult,
} from "../types";
import { ANAM_EXTERNAL_LLM_ID } from "../types";
import { ANAM_AVATAR_ONLY_SYSTEM_PROMPT } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import { getProviderConfigRow, mergeProviderConfig } from "./update-provider-config";

type AnamListResponse<T> = {
  data?: T[];
};

type AnamPersonaResponse = {
  id?: string;
};

function toFailure(message: string): ProvisionProviderResult {
  return {
    status: "failed",
    failureReason: message,
    providerMetadata: { failedAt: new Date().toISOString() },
  };
}

async function fetchAnamJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const apiKey = getAnamApiKey();
  if (!apiKey) {
    throw new Error("ANAM_API_KEY is not configured");
  }

  const response = await fetch(`${getAnamApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Anam request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function resolveAvatarId(
  employeeId: string,
  employeeName: string,
  config: AvatarProviderConfigPayload,
): Promise<string> {
  if (config.avatarId && !config.imageUrl) {
    return config.avatarId;
  }

  if (config.imageUrl) {
    const adapter = resolveAvatarProvider("anam");
    const created = await adapter.createAvatar({
      employeeId,
      name: employeeName,
    });
    return created.avatarId;
  }

  const avatars = await fetchAnamJson<AnamListResponse<{ id: string }>>(
    "/avatars?perPage=1",
  );
  const stockAvatarId = avatars.data?.[0]?.id;
  if (!stockAvatarId) {
    throw new Error("Anam avatar catalog returned no avatars");
  }

  return stockAvatarId;
}

async function resolveAnamVoiceId(preferredVoiceId?: string): Promise<string> {
  if (preferredVoiceId) {
    return preferredVoiceId;
  }

  const voices = await fetchAnamJson<AnamListResponse<{ id: string }>>(
    "/voices?perPage=1",
  );
  const voiceId = voices.data?.[0]?.id;
  if (!voiceId) {
    throw new Error("Anam voice catalog returned no voices");
  }

  return voiceId;
}

export async function provisionAvatarProvider(
  input: ProvisionAvatarProviderInput,
): Promise<ProvisionProviderResult> {
  const existing = await getProviderConfigRow(input.employeeId, "avatar");
  if (!existing || existing.providerId !== "anam") {
    return {
      status: "ready",
      providerMetadata: { skipped: true, reason: "avatar_provider_not_anam" },
    };
  }

  await mergeProviderConfig(input.employeeId, "avatar", {
    provisioningStatus: "provisioning",
  });

  const config = (await getProviderConfigRow(input.employeeId, "avatar"))
    ?.config as AvatarProviderConfigPayload;

  if (!config) {
    const failure = toFailure("Avatar provider config is missing");
    await mergeProviderConfig(input.employeeId, "avatar", {
      provisioningStatus: "failed",
      failureReason: failure.failureReason,
      providerMetadata: failure.providerMetadata,
    });
    return failure;
  }

  if (!hasAnamCredentials()) {
    const failure = toFailure("ANAM_API_KEY is not configured");
    await mergeProviderConfig(input.employeeId, "avatar", {
      provisioningStatus: "failed",
      failureReason: failure.failureReason,
      providerMetadata: failure.providerMetadata,
    });
    return failure;
  }

  if (config.provisioningStatus === "ready" && config.personaId) {
    return {
      status: "ready",
      providerResourceId: config.personaId,
      providerMetadata: {
        skipped: true,
        reason: "studio_persona_already_ready",
        ...(config.providerMetadata ?? {}),
      },
    };
  }

  const studioAvatarReady =
    config.provisioningStatus === "ready" && Boolean(config.avatarId);

  const metadataAnamVoiceId =
    typeof config.providerMetadata?.anamPersonaVoiceId === "string"
      ? config.providerMetadata.anamPersonaVoiceId
      : undefined;

  try {
    const avatarId = studioAvatarReady
      ? config.avatarId!
      : await resolveAvatarId(input.employeeId, input.employeeName, config);
    const voiceId = metadataAnamVoiceId
      ? metadataAnamVoiceId
      : await resolveAnamVoiceId(
          config.providerMetadata?.voiceBinding === "anam"
            ? input.voiceId
            : undefined,
        );

    const persona = await fetchAnamJson<AnamPersonaResponse>("/personas", {
      method: "POST",
      body: JSON.stringify({
        name: input.employeeName,
        description: `${input.employeeName} NULLXES digital employee persona`,
        avatarId,
        voiceId,
        llmId: ANAM_EXTERNAL_LLM_ID,
        skipGreeting: true,
        systemPrompt: ANAM_AVATAR_ONLY_SYSTEM_PROMPT,
      }),
    });

    if (!persona.id) {
      throw new Error("Anam create persona returned an invalid response");
    }

    const providerMetadata = {
      provisionedAt: new Date().toISOString(),
      resourceType: "anam_persona",
      avatarId,
      voiceId,
      llmId: ANAM_EXTERNAL_LLM_ID,
    };

    await mergeProviderConfig(input.employeeId, "avatar", {
      provisioningStatus: "ready",
      personaId: persona.id,
      avatarId,
      providerMetadata,
      failureReason: undefined,
    });

    return {
      status: "ready",
      providerResourceId: persona.id,
      providerMetadata,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Anam provisioning failed";
    const failure = toFailure(message);
    await mergeProviderConfig(input.employeeId, "avatar", {
      provisioningStatus: "failed",
      failureReason: failure.failureReason,
      providerMetadata: failure.providerMetadata,
    });
    return failure;
  }
}

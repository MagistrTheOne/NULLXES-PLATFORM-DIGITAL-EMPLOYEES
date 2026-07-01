import type { AvatarProviderConfigPayload } from "@/entities/provider-config";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import {
  anamFetchWithKeyPool,
  hasAnamCredentials,
} from "@/shared/config/provider-env";
import { buildAnamPersonaCreatePayload } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import { syncAnamPersonaExternalBrain } from "./sync-anam-persona-external-brain";
import {
  isAnamSlotAtPersonaCapacity,
  resolveAnamPersonaSlot,
} from "./resolve-anam-persona-slot";
import type {
  ProvisionAvatarProviderInput,
  ProvisionProviderResult,
} from "../types";
import { ANAM_EXTERNAL_LLM_ID } from "../types";
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
  preferredSlot?: string | null,
): Promise<T> {
  const { response } = await anamFetchWithKeyPool(
    path,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
    preferredSlot,
  );

  return (await response.json()) as T;
}

type ResolvedAvatar = {
  avatarId: string;
  /** Slot the avatar lives on — the persona MUST be created on the same key. */
  slot: string | null;
};

async function resolveAvatarId(
  employeeName: string,
  config: AvatarProviderConfigPayload,
  preferredSlot?: string | null,
): Promise<ResolvedAvatar> {
  // Reuse the stored avatar whenever it exists — re-provisioning after a
  // failure must not burn another one-shot avatar against the account quota.
  if (config.avatarId) {
    return { avatarId: config.avatarId, slot: preferredSlot ?? null };
  }

  if (config.imageUrl) {
    // One-shot avatars count against a per-account quota, so create them on the
    // resolved slot. The pool rotates on quota errors and reports the slot it
    // landed on, which the persona then reuses to stay on the same account.
    const { response, slot } = await anamFetchWithKeyPool(
      "/avatars",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: employeeName,
          imageUrl: config.imageUrl,
        }),
      },
      preferredSlot,
    );

    const created = (await response.json()) as { id?: string };
    if (!created.id) {
      throw new Error("Anam createAvatar returned an invalid response");
    }

    return {
      avatarId: created.id,
      slot: slot ?? preferredSlot ?? null,
    };
  }

  // Catalog lookup MUST use the same key/account that will create the persona,
  // otherwise the persona references an avatar from a different Anam account.
  const avatars = await fetchAnamJson<AnamListResponse<{ id: string }>>(
    "/avatars?perPage=1",
    undefined,
    preferredSlot,
  );
  const stockAvatarId = avatars.data?.[0]?.id;
  if (!stockAvatarId) {
    throw new Error("Anam avatar catalog returned no avatars");
  }

  return { avatarId: stockAvatarId, slot: preferredSlot ?? null };
}

async function resolveAnamVoiceId(
  preferredVoiceId?: string,
  preferredSlot?: string | null,
): Promise<string> {
  if (preferredVoiceId) {
    return preferredVoiceId;
  }

  const voices = await fetchAnamJson<AnamListResponse<{ id: string }>>(
    "/voices?perPage=1",
    undefined,
    preferredSlot,
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
    await syncAnamPersonaExternalBrain({
      personaId: config.personaId,
      employeeId: input.employeeId,
      anamApiKeySlot:
        typeof config.providerMetadata?.anamApiKeySlot === "string"
          ? config.providerMetadata.anamApiKeySlot
          : null,
    });

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

  const studioAnamApiKeySlot =
    typeof config.providerMetadata?.anamApiKeySlot === "string"
      ? config.providerMetadata.anamApiKeySlot
      : null;

  // No studio-pinned key → pick a key that isn't already at its persona cap so
  // we distribute personas across the pool instead of overloading one account.
  let anamApiKeySlot =
    studioAnamApiKeySlot ??
    (await resolveAnamPersonaSlot({ excludeEmployeeId: input.employeeId }));

  // A one-shot avatar only exists on the account that created it. When the
  // employee already has an avatarId pinned to a studio slot, the persona MUST
  // stay on that slot — moving to another key yields Anam 400 "Avatar not found".
  const avatarPinnedToStudioSlot = Boolean(
    config.avatarId && studioAnamApiKeySlot,
  );

  if (
    anamApiKeySlot &&
    !config.personaId &&
    studioAnamApiKeySlot &&
    !avatarPinnedToStudioSlot &&
    (await isAnamSlotAtPersonaCapacity(
      anamApiKeySlot as AnamApiKeySlot,
      {
        excludeEmployeeId: input.employeeId,
      },
    ))
  ) {
    anamApiKeySlot = await resolveAnamPersonaSlot({
      excludeEmployeeId: input.employeeId,
    });
  }

  try {
    const avatarResolution: ResolvedAvatar = studioAvatarReady
      ? { avatarId: config.avatarId!, slot: anamApiKeySlot }
      : await resolveAvatarId(input.employeeName, config, anamApiKeySlot);
    const avatarId = avatarResolution.avatarId;
    // Pin the persona to whichever account the avatar ended up on.
    const personaSlot = avatarResolution.slot ?? anamApiKeySlot;

    const voiceId = metadataAnamVoiceId
      ? metadataAnamVoiceId
      : await resolveAnamVoiceId(
          config.providerMetadata?.voiceBinding === "anam"
            ? input.voiceId
            : undefined,
          personaSlot,
        );

    const createPersona = async (
      personaAvatarId: string,
      preferredSlot: string | null,
    ): Promise<{ persona: AnamPersonaResponse; slot: string }> => {
      const { response, slot } = await anamFetchWithKeyPool(
        "/personas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            buildAnamPersonaCreatePayload({
              name: input.employeeName,
              avatarId: personaAvatarId,
              voiceId,
            }),
          ),
        },
        preferredSlot,
      );

      return {
        persona: (await response.json()) as AnamPersonaResponse,
        slot,
      };
    };

    let persona: AnamPersonaResponse;
    let usedApiKeySlot: string = personaSlot ?? "";
    let finalAvatarId = avatarId;

    try {
      const created = await createPersona(avatarId, personaSlot);
      persona = created.persona;
      usedApiKeySlot = created.slot;
    } catch (personaError) {
      const detail =
        personaError instanceof Error ? personaError.message : "";
      const avatarMissing = /avatar not found/i.test(detail);

      // The stored one-shot avatar no longer exists on its account (deleted or
      // slot metadata drifted). If we still have a source image (upload or the
      // rendered preview), recreate the avatar and retry persona creation once.
      const sourceImageUrl = config.imageUrl ?? config.previewUrl;
      if (!avatarMissing || !sourceImageUrl) {
        throw personaError;
      }

      const { response: avatarResponse, slot: recreatedSlot } =
        await anamFetchWithKeyPool(
          "/avatars",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: input.employeeName,
              imageUrl: sourceImageUrl,
            }),
          },
          personaSlot,
        );

      const recreated = (await avatarResponse.json()) as { id?: string };
      if (!recreated.id) {
        throw new Error("Anam avatar recreation returned an invalid response");
      }

      finalAvatarId = recreated.id;
      const retried = await createPersona(recreated.id, recreatedSlot);
      persona = retried.persona;
      usedApiKeySlot = retried.slot;
    }

    if (!persona.id) {
      throw new Error("Anam create persona returned an invalid response");
    }

    const providerMetadata = {
      provisionedAt: new Date().toISOString(),
      resourceType: "anam_persona",
      avatarId: finalAvatarId,
      anamPersonaVoiceId: voiceId,
      voiceId,
      llmId: ANAM_EXTERNAL_LLM_ID,
      ...(usedApiKeySlot ? { anamApiKeySlot: usedApiKeySlot } : {}),
    };

    await mergeProviderConfig(input.employeeId, "avatar", {
      provisioningStatus: "ready",
      personaId: persona.id,
      avatarId: finalAvatarId,
      providerMetadata,
      failureReason: undefined,
    });

    await syncAnamPersonaExternalBrain({
      personaId: persona.id,
      employeeId: input.employeeId,
      anamApiKeySlot: usedApiKeySlot,
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
      providerMetadata: {
        ...(config.providerMetadata ?? {}),
        ...failure.providerMetadata,
        ...(anamApiKeySlot ? { anamApiKeySlot } : {}),
      },
    });
    return failure;
  }
}

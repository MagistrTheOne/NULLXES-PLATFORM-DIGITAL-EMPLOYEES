import {
  describeAnamAvatarTalkReadiness,
} from "@/features/employees/lib/resolve-anam-avatar-talk-readiness";
import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";
import { syncAnamPersonaExternalBrain } from "@/features/provider-provisioning/services/sync-anam-persona-external-brain";
import { buildAnamTalkEphemeralPersonaConfig } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import {
  ANAM_CARA3_VIDEO_DIMENSIONS,
  ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS,
  buildAnamTalkSessionVideoOptions,
  pickPreferredAnamVideoDimension,
  resolveAnamTalkVideoOptionsForModel,
  type AnamTalkSessionVideoOptions,
} from "@/features/runtime-session/lib/anam-session-tuning";
import { resolveTalkAnamLanguageCode } from "@/features/runtime-session/services/resolve-talk-anam-language";
import { getAnamApiBaseUrl } from "@/shared/config/provider-env";
import {
  getAnamApiKeysInOrder,
  isAnamAvatarQuotaError,
} from "@/shared/config/anam-api-pool";
import type { EmployeeTalkContext } from "../types/employee-talk-context";
import { getEmployeeTalkContext } from "./get-employee-talk-context";

export type AnamTalkSessionTokenResult =
  | { ok: true; sessionToken: string }
  | { ok: false; message: string; code?: "PROVIDER_QUOTA" };

function isExternalBrainSynced(
  metadata: Record<string, unknown> | null,
): boolean {
  return (
    typeof metadata?.externalBrainSyncedAt === "string" &&
    metadata.externalBrainLlmId === ANAM_EXTERNAL_LLM_ID
  );
}

function buildSessionRequestBody(
  personaConfig: ReturnType<typeof buildAnamTalkEphemeralPersonaConfig>,
  videoOptions: AnamTalkSessionVideoOptions,
): string {
  return JSON.stringify({
    clientLabel: "nullxes-digital-employees",
    personaConfig,
    sessionOptions: {
      sessionReplay: {
        enableSessionReplay: false,
      },
      ...(videoOptions.videoQuality ? { videoQuality: videoOptions.videoQuality } : {}),
      ...(videoOptions.videoWidth && videoOptions.videoHeight
        ? {
            videoWidth: videoOptions.videoWidth,
            videoHeight: videoOptions.videoHeight,
          }
        : {}),
    },
  });
}

type AnamSessionErrorPayload = {
  message?: string;
  error?: string;
  supportedDimensions?: string[];
};

type AnamAvatarVersionPayload = {
  activeVersion?: string | null;
  availableVersions?: string[];
};

function extractSupportedDimensionsFromMessage(
  message: string | undefined,
): string[] {
  if (!message) {
    return [];
  }
  // e.g. "Supported dimensions: 720x480." or "Supported dimensions: 1152x768, 768x1152."
  const match = /Supported dimensions:\s*([^.]+)/i.exec(message);
  if (!match?.[1]) {
    return [];
  }
  return match[1]
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveFallbackVideoOptions(
  current: AnamTalkSessionVideoOptions,
  payload: AnamSessionErrorPayload,
): AnamTalkSessionVideoOptions | null {
  const isDimensionError =
    payload.error === "video_dimensions_not_supported_for_model" ||
    /Video dimensions .+ are not supported/i.test(payload.message ?? "");

  if (!isDimensionError) {
    return null;
  }

  const supported = [
    ...(payload.supportedDimensions ?? []),
    ...extractSupportedDimensionsFromMessage(payload.message),
  ];

  const preferred = pickPreferredAnamVideoDimension(supported);
  if (
    preferred &&
    (preferred.videoWidth !== current.videoWidth ||
      preferred.videoHeight !== current.videoHeight)
  ) {
    return {
      videoQuality: current.videoQuality,
      videoWidth: preferred.videoWidth,
      videoHeight: preferred.videoHeight,
    };
  }

  // Flip between known cara-3 / cara-4 sizes when Anam omitted a parseable list.
  if (
    current.videoWidth === ANAM_CARA3_VIDEO_DIMENSIONS.videoWidth &&
    current.videoHeight === ANAM_CARA3_VIDEO_DIMENSIONS.videoHeight
  ) {
    return {
      videoQuality: current.videoQuality,
      ...ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS,
    };
  }

  if (
    current.videoWidth === ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS.videoWidth &&
    current.videoHeight === ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS.videoHeight
  ) {
    return {
      videoQuality: current.videoQuality,
      ...ANAM_CARA3_VIDEO_DIMENSIONS,
    };
  }

  return {
    videoQuality: current.videoQuality,
    ...ANAM_CARA3_VIDEO_DIMENSIONS,
  };
}

async function resolveVideoOptionsForAvatar(input: {
  avatarId: string;
  preferredSlot: string | null;
  override?: AnamTalkSessionVideoOptions | null;
}): Promise<AnamTalkSessionVideoOptions> {
  if (
    input.override?.videoWidth &&
    input.override.videoHeight &&
    input.override.videoWidth > 0 &&
    input.override.videoHeight > 0
  ) {
    return {
      videoQuality:
        input.override.videoQuality ??
        buildAnamTalkSessionVideoOptions().videoQuality,
      videoWidth: Math.floor(input.override.videoWidth),
      videoHeight: Math.floor(input.override.videoHeight),
    };
  }

  const keyPool = getAnamApiKeysInOrder(input.preferredSlot);
  for (const entry of keyPool) {
    try {
      const response = await fetch(
        `${getAnamApiBaseUrl()}/avatars/${encodeURIComponent(input.avatarId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${entry.key}`,
          },
        },
      );
      if (!response.ok) {
        if (isAnamAvatarQuotaError(response.status, response.statusText)) {
          continue;
        }
        break;
      }

      const avatar = (await response.json()) as AnamAvatarVersionPayload;
      const model =
        avatar.activeVersion?.trim() ||
        avatar.availableVersions?.find((version) => version.trim().length > 0) ||
        null;
      if (model) {
        return resolveAnamTalkVideoOptionsForModel(model);
      }
      break;
    } catch {
      continue;
    }
  }

  return buildAnamTalkSessionVideoOptions();
}

export async function createAnamTalkSessionTokenForEmployee(
  organizationId: string,
  employeeId: string,
  talkContext?: EmployeeTalkContext | null,
  videoOptionsOverride?: AnamTalkSessionVideoOptions | null,
): Promise<AnamTalkSessionTokenResult> {
  const employee =
    talkContext ??
    (await getEmployeeTalkContext(organizationId, employeeId));

  if (!employee) {
    return { ok: false, message: "Employee not found" };
  }

  if (!employee.avatarId || !employee.anamVoiceId) {
    return {
      ok: false,
      message: describeAnamAvatarTalkReadiness({
        avatarId: employee.avatarId ?? undefined,
        personaId: employee.personaId ?? undefined,
        previewUrl: employee.avatarPreviewUrl ?? undefined,
        provisioningStatus: employee.avatarProvisioningStatus,
        providerMetadata: employee.anamVoiceId
          ? { anamPersonaVoiceId: employee.anamVoiceId }
          : undefined,
      }),
    };
  }

  const apiKeySlot =
    typeof employee.avatarProviderMetadata?.anamApiKeySlot === "string"
      ? employee.avatarProviderMetadata.anamApiKeySlot
      : null;

  const keyPool = getAnamApiKeysInOrder(apiKeySlot);
  if (keyPool.length === 0) {
    return {
      ok: false,
      code: "PROVIDER_QUOTA",
      message: "Anam API key pool is not configured.",
    };
  }

  if (employee.personaId && !isExternalBrainSynced(employee.avatarProviderMetadata)) {
    try {
      await syncAnamPersonaExternalBrain({
        personaId: employee.personaId,
        employeeId: employee.id,
        anamApiKeySlot: apiKeySlot,
      });
    } catch {
      // Best-effort sync; session token can still be requested.
    }
  }

  const languageCode = await resolveTalkAnamLanguageCode({
    organizationId,
    employeeId,
  });
  const personaConfig = buildAnamTalkEphemeralPersonaConfig({
    name: employee.name,
    avatarId: employee.avatarId,
    voiceId: employee.anamVoiceId,
    languageCode,
  });

  let videoOptions = await resolveVideoOptionsForAvatar({
    avatarId: employee.avatarId,
    preferredSlot: apiKeySlot,
    override: videoOptionsOverride,
  });
  let lastMessage = "Anam session token failed";
  let lastFailureWasQuota = false;
  let dimensionRetries = 0;
  const maxDimensionRetries = 2;

  for (const entry of keyPool) {
    const response = await fetch(`${getAnamApiBaseUrl()}/auth/session-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${entry.key}`,
        "Content-Type": "application/json",
      },
      body: buildSessionRequestBody(personaConfig, videoOptions),
    });

    if (response.ok) {
      const payload = (await response.json()) as { sessionToken?: string };
      if (!payload.sessionToken) {
        return { ok: false, message: "Anam returned an invalid session token" };
      }

      return { ok: true, sessionToken: payload.sessionToken };
    }

    let detail = response.statusText;
    let errorPayload: AnamSessionErrorPayload = {};
    try {
      errorPayload = (await response.json()) as AnamSessionErrorPayload;
      detail = errorPayload.message ?? errorPayload.error ?? detail;
    } catch {
      // ignore
    }

    lastMessage = `Anam session token failed (${response.status}): ${detail}`;

    if (
      dimensionRetries < maxDimensionRetries &&
      (errorPayload.error === "video_dimensions_not_supported_for_model" ||
        /Video dimensions .+ are not supported/i.test(errorPayload.message ?? ""))
    ) {
      const fallback = resolveFallbackVideoOptions(videoOptions, errorPayload);
      if (fallback) {
        videoOptions = fallback;
        dimensionRetries += 1;
        const retry = await fetch(`${getAnamApiBaseUrl()}/auth/session-token`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${entry.key}`,
            "Content-Type": "application/json",
          },
          body: buildSessionRequestBody(personaConfig, videoOptions),
        });

        if (retry.ok) {
          const payload = (await retry.json()) as { sessionToken?: string };
          if (!payload.sessionToken) {
            return { ok: false, message: "Anam returned an invalid session token" };
          }
          return { ok: true, sessionToken: payload.sessionToken };
        }

        try {
          const retryPayload = (await retry.json()) as AnamSessionErrorPayload;
          detail = retryPayload.message ?? retryPayload.error ?? retry.statusText;
          lastMessage = `Anam session token failed (${retry.status}): ${detail}`;
          errorPayload = retryPayload;
          if (isAnamAvatarQuotaError(retry.status, detail)) {
            lastFailureWasQuota = true;
            continue;
          }
          // Keep looping dimension retries on same key when still a dim error.
          if (
            dimensionRetries < maxDimensionRetries &&
            (retryPayload.error === "video_dimensions_not_supported_for_model" ||
              /Video dimensions .+ are not supported/i.test(
                retryPayload.message ?? "",
              ))
          ) {
            const next = resolveFallbackVideoOptions(videoOptions, retryPayload);
            if (next) {
              videoOptions = next;
              dimensionRetries += 1;
              continue;
            }
          }
        } catch {
          lastMessage = `Anam session token failed (${retry.status}): ${retry.statusText}`;
        }

        return { ok: false, message: lastMessage };
      }
    }

    if (isAnamAvatarQuotaError(response.status, detail)) {
      lastFailureWasQuota = true;
      continue;
    }

    return { ok: false, message: lastMessage };
  }

  return {
    ok: false,
    code: lastFailureWasQuota ? "PROVIDER_QUOTA" : undefined,
    message: lastMessage,
  };
}

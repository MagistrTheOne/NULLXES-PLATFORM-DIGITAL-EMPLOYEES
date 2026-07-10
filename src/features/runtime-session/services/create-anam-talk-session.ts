import {
  describeAnamAvatarTalkReadiness,
} from "@/features/employees/lib/resolve-anam-avatar-talk-readiness";
import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";
import { syncAnamPersonaExternalBrain } from "@/features/provider-provisioning/services/sync-anam-persona-external-brain";
import { buildAnamTalkEphemeralPersonaConfig } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import {
  ANAM_CARA3_VIDEO_DIMENSIONS,
  buildAnamTalkSessionVideoOptions,
  parseAnamSupportedVideoDimension,
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

function resolveFallbackVideoOptions(
  current: AnamTalkSessionVideoOptions,
  payload: AnamSessionErrorPayload,
): AnamTalkSessionVideoOptions | null {
  if (payload.error !== "video_dimensions_not_supported_for_model") {
    return null;
  }

  const supported = payload.supportedDimensions ?? [];
  let parsedAnySupported = false;

  for (const token of supported) {
    const parsed = parseAnamSupportedVideoDimension(token);
    if (!parsed) {
      continue;
    }

    parsedAnySupported = true;

    // Prefer a supported size that differs from what already failed.
    if (
      parsed.videoWidth !== current.videoWidth ||
      parsed.videoHeight !== current.videoHeight
    ) {
      return {
        videoQuality: current.videoQuality,
        videoWidth: parsed.videoWidth,
        videoHeight: parsed.videoHeight,
      };
    }
  }

  // Anam returned a supported list, but every parseable entry matches current.
  // Do not invent cara-3 — only omit custom dims (model default) or give up.
  if (parsedAnySupported) {
    if (current.videoWidth || current.videoHeight) {
      return { videoQuality: current.videoQuality };
    }
    return null;
  }

  // No usable supportedDimensions from Anam — generic fallbacks.
  if (
    current.videoWidth !== ANAM_CARA3_VIDEO_DIMENSIONS.videoWidth ||
    current.videoHeight !== ANAM_CARA3_VIDEO_DIMENSIONS.videoHeight
  ) {
    return {
      videoQuality: current.videoQuality,
      ...ANAM_CARA3_VIDEO_DIMENSIONS,
    };
  }

  // Last resort: omit custom dimensions and let Anam use the model default.
  if (current.videoWidth || current.videoHeight) {
    return { videoQuality: current.videoQuality };
  }

  return null;
}

export async function createAnamTalkSessionTokenForEmployee(
  organizationId: string,
  employeeId: string,
  talkContext?: EmployeeTalkContext | null,
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

  let videoOptions = buildAnamTalkSessionVideoOptions();
  let lastMessage = "Anam session token failed";
  let lastFailureWasQuota = false;
  let dimensionRetryUsed = false;

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
      !dimensionRetryUsed &&
      errorPayload.error === "video_dimensions_not_supported_for_model"
    ) {
      const fallback = resolveFallbackVideoOptions(videoOptions, errorPayload);
      if (fallback) {
        videoOptions = fallback;
        dimensionRetryUsed = true;
        // Retry the same key with corrected dimensions before rotating the pool.
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
          if (isAnamAvatarQuotaError(retry.status, detail)) {
            lastFailureWasQuota = true;
            continue;
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

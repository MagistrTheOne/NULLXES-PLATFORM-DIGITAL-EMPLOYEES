import {
  describeAnamAvatarTalkReadiness,
} from "@/features/employees/lib/resolve-anam-avatar-talk-readiness";
import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";
import { syncAnamPersonaExternalBrain } from "@/features/provider-provisioning/services/sync-anam-persona-external-brain";
import { buildAnamTalkEphemeralPersonaConfig } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
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

  const requestBody = JSON.stringify({
    clientLabel: "nullxes-digital-employees",
    personaConfig,
    sessionOptions: {
      sessionReplay: {
        enableSessionReplay: false,
      },
    },
  });

  let lastMessage = "Anam session token failed";
  let lastFailureWasQuota = false;

  for (const entry of keyPool) {
    const response = await fetch(`${getAnamApiBaseUrl()}/auth/session-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${entry.key}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    if (response.ok) {
      const payload = (await response.json()) as { sessionToken?: string };
      if (!payload.sessionToken) {
        return { ok: false, message: "Anam returned an invalid session token" };
      }

      return { ok: true, sessionToken: payload.sessionToken };
    }

    let detail = response.statusText;
    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };
      detail = payload.message ?? payload.error ?? detail;
    } catch {
      // ignore
    }

    lastMessage = `Anam session token failed (${response.status}): ${detail}`;

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

import {
  describeAnamAvatarTalkReadiness,
} from "@/features/employees/lib/resolve-anam-avatar-talk-readiness";
import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";
import { syncAnamPersonaExternalBrain } from "@/features/provider-provisioning/services/sync-anam-persona-external-brain";
import { buildAnamTalkEphemeralPersonaConfig } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import { resolveTalkSpeechLanguageCode } from "@/features/runtime-session/services/resolve-talk-speech-language";
import { getAnamApiBaseUrl, getAnamApiKey } from "@/shared/config/provider-env";
import type { EmployeeTalkContext } from "../types/employee-talk-context";
import { getEmployeeTalkContext } from "./get-employee-talk-context";

export type AnamTalkSessionTokenResult =
  | { ok: true; sessionToken: string }
  | { ok: false; message: string };

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

  const apiKey = getAnamApiKey();
  if (!apiKey) {
    return { ok: false, message: "ANAM_API_KEY is not configured" };
  }

  if (employee.personaId && !isExternalBrainSynced(employee.avatarProviderMetadata)) {
    try {
      await syncAnamPersonaExternalBrain({
        personaId: employee.personaId,
        employeeId: employee.id,
      });
    } catch (syncError: unknown) {
      console.warn("Anam persona external-brain sync failed", syncError);
    }
  }

  const languageCode = await resolveTalkSpeechLanguageCode(organizationId);
  const personaConfig = buildAnamTalkEphemeralPersonaConfig({
    name: employee.name,
    avatarId: employee.avatarId,
    voiceId: employee.anamVoiceId,
    languageCode,
  });

  const response = await fetch(`${getAnamApiBaseUrl()}/auth/session-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientLabel: "nullxes-digital-employees",
      personaConfig,
      sessionOptions: {
        sessionReplay: {
          enableSessionReplay: false,
        },
      },
    }),
  });

  if (!response.ok) {
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

    return {
      ok: false,
      message: `Anam session token failed (${response.status}): ${detail}`,
    };
  }

  const payload = (await response.json()) as { sessionToken?: string };
  if (!payload.sessionToken) {
    return { ok: false, message: "Anam returned an invalid session token" };
  }

  return { ok: true, sessionToken: payload.sessionToken };
}

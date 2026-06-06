import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import { syncAnamPersonaExternalBrain } from "@/features/provider-provisioning/services/sync-anam-persona-external-brain";
import { buildAnamTalkSessionPersonaConfig } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import { resolveTalkVoiceMode } from "@/features/runtime-session/services/resolve-talk-voice-mode";
import { getAnamApiBaseUrl, getAnamApiKey } from "@/shared/config/provider-env";

export type AnamTalkSessionTokenResult =
  | { ok: true; sessionToken: string }
  | { ok: false; message: string };

export async function createAnamTalkSessionTokenForEmployee(
  organizationId: string,
  employeeId: string,
): Promise<AnamTalkSessionTokenResult> {
  const employee = await getEmployeeDetail(organizationId, employeeId);

  if (!employee) {
    return { ok: false, message: "Employee not found" };
  }

  if (!employee.personaId) {
    return {
      ok: false,
      message: "Anam persona is not ready for this employee yet.",
    };
  }

  const apiKey = getAnamApiKey();
  if (!apiKey) {
    return { ok: false, message: "ANAM_API_KEY is not configured" };
  }

  try {
    await syncAnamPersonaExternalBrain(employee.personaId);
  } catch (syncError: unknown) {
    console.warn("Anam persona external-brain sync failed", syncError);
  }

  const voiceMode = resolveTalkVoiceMode(employee);
  const personaConfig = buildAnamTalkSessionPersonaConfig({
    personaId: employee.personaId,
    enableAudioPassthrough: voiceMode === "elevenlabs",
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

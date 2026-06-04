"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import { getAnamApiBaseUrl, getAnamApiKey } from "@/shared/config/provider-env";

export type CreateAnamTalkSessionTokenResult =
  | { ok: true; sessionToken: string }
  | { ok: false; message: string };

export async function createAnamTalkSessionToken(
  employeeId: string,
): Promise<CreateAnamTalkSessionTokenResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const employee = await getEmployeeDetail(workspace.organization.id, employeeId);

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

  const response = await fetch(`${getAnamApiBaseUrl()}/auth/session-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientLabel: "nullxes-digital-employees",
      personaConfig: {
        personaId: employee.personaId,
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

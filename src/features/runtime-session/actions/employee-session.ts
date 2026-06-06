"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { inngest } from "@/inngest/client";
import { createAnamTalkSessionTokenForEmployee } from "../services/create-anam-talk-session";
import {
  activateEmployeeSession,
  completeEmployeeSession,
  failEmployeeSession,
  startEmployeeSession,
} from "../services/record-employee-session";

async function resolveWorkspaceContext() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  return {
    organizationId: workspace.organization.id,
    userId: session.user.id,
  };
}

export async function activateTalkSessionAction(sessionId: string): Promise<void> {
  const { organizationId, userId } = await resolveWorkspaceContext();
  await activateEmployeeSession({ sessionId, organizationId, userId });
}

export async function completeTalkSessionAction(
  sessionId: string,
  startedAtIso?: string,
): Promise<void> {
  const { organizationId, userId } = await resolveWorkspaceContext();
  const result = await completeEmployeeSession({
    sessionId,
    organizationId,
    userId,
    startedAt: startedAtIso ? new Date(startedAtIso) : undefined,
  });

  try {
    await inngest.send({
      name: "employee/session.completed",
      data: { sessionId, organizationId },
    });
  } catch (error) {
    console.error("[completeTalkSessionAction] Inngest send failed:", error);
  }

  if (result) {
    void dispatchOrganizationWebhook({
      organizationId,
      event: "session.completed",
      data: {
        sessionId,
        employeeId: result.employeeId,
        durationSeconds: result.durationSeconds,
        status: result.status,
        limitExceeded: result.limitExceeded,
      },
    });
  }
}

export async function failTalkSessionAction(sessionId: string): Promise<void> {
  const { organizationId, userId } = await resolveWorkspaceContext();
  await failEmployeeSession({ sessionId, organizationId, userId });
}

export type StartTalkSessionResult =
  | { ok: true; sessionId: string; sessionToken: string }
  | { ok: false; message: string };

export async function startTalkSessionAction(
  employeeId: string,
): Promise<StartTalkSessionResult> {
  const { organizationId, userId } = await resolveWorkspaceContext();

  const anamToken = await createAnamTalkSessionTokenForEmployee(
    organizationId,
    employeeId,
  );
  if (!anamToken.ok) {
    return { ok: false, message: anamToken.message };
  }

  const sessionId = await startEmployeeSession({
    organizationId,
    employeeId,
    userId,
  });

  return {
    ok: true,
    sessionId,
    sessionToken: anamToken.sessionToken,
  };
}

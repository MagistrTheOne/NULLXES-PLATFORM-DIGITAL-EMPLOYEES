"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { inngest } from "@/inngest/client";
import {
  activateEmployeeSession,
  completeEmployeeSession,
  failEmployeeSession,
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

  await inngest.send({
    name: "employee/session.completed",
    data: { sessionId, organizationId },
  });

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

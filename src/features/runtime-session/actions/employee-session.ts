"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { createAnamTalkSessionTokenForEmployee } from "../services/create-anam-talk-session";
import { resolveTalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import {
  activateEmployeeSession,
  completeEmployeeSession,
  failEmployeeSession,
  startEmployeeSession,
} from "../services/record-employee-session";

async function resolveWorkspaceContext() {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canOperateEmployees",
  );
  return {
    organizationId: workspace.organization.id,
    userId: workspace.user.id,
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

  if (isInngestEnabledForSend()) {
    try {
      await inngest.send({
        name: "employee/session.completed",
        data: { sessionId, organizationId },
      });
    } catch (error) {
      console.error("[completeTalkSessionAction] Inngest send failed:", error);
    }
  } else if (process.env.NODE_ENV === "development") {
    console.warn(
      "[completeTalkSessionAction] Inngest event skipped. Set INNGEST_DEV=1 and run npm run inngest:dev for local background jobs.",
    );
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
  | {
      ok: true;
      sessionId: string;
      sessionToken: string;
      voiceMode: "elevenlabs" | "anam";
    }
  | { ok: false; message: string };

export async function startTalkSessionAction(
  employeeId: string,
): Promise<StartTalkSessionResult> {
  try {
    const { organizationId, userId } = await resolveWorkspaceContext();

  const employee = await getEmployeeDetail(organizationId, employeeId);
  if (!employee) {
    return { ok: false, message: "Employee not found" };
  }

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
    voiceMode: resolveTalkVoiceMode(employee),
  };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}

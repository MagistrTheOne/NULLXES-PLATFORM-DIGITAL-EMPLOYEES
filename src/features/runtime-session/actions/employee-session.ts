"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { createAnamTalkSessionTokenForEmployee } from "../services/create-anam-talk-session";
import { resolveTalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { getEmployeeTalkContext } from "../services/get-employee-talk-context";
import { measureTalkPerf } from "../lib/talk-perf-log";
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
  satisfactionRating?: number,
  startedAtIso?: string,
): Promise<void> {
  const { organizationId, userId } = await resolveWorkspaceContext();
  const result = await completeEmployeeSession({
    sessionId,
    organizationId,
    userId,
    startedAt: startedAtIso ? new Date(startedAtIso) : undefined,
    satisfactionRating,
  });

  if (isInngestEnabledForSend()) {
    try {
      await inngest.send({
        name: "employee/session.completed",
        data: { sessionId, organizationId },
      });
    } catch {
      // Background job dispatch is best-effort; session completion already persisted.
    }
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
        ...(satisfactionRating !== undefined
          ? { satisfactionRating }
          : {}),
      },
    });
  }
}

export async function failTalkSessionAction(sessionId: string): Promise<void> {
  const { organizationId, userId } = await resolveWorkspaceContext();
  await failEmployeeSession({ sessionId, organizationId, userId });
}

export async function appendSessionMessageAction(input: {
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  streamMessageId?: string;
}): Promise<void> {
  const { organizationId, userId } = await resolveWorkspaceContext();
  const { appendSessionMessage } = await import(
    "../services/append-session-message"
  );
  await appendSessionMessage({
    sessionId: input.sessionId,
    organizationId,
    userId,
    role: input.role,
    content: input.content,
    streamMessageId: input.streamMessageId,
  });
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

    const employee = await getEmployeeTalkContext(organizationId, employeeId);
    if (!employee) {
      return { ok: false, message: "Employee not found" };
    }

    return measureTalkPerf(
      "talk.session.start",
      async () => {
        const [anamToken, sessionId] = await Promise.all([
          createAnamTalkSessionTokenForEmployee(
            organizationId,
            employeeId,
            employee,
          ),
          startEmployeeSession({
            organizationId,
            employeeId,
            userId,
          }),
        ]);

        if (!anamToken.ok) {
          return { ok: false, message: anamToken.message };
        }

        return {
          ok: true,
          sessionId,
          sessionToken: anamToken.sessionToken,
          voiceMode: resolveTalkVoiceMode(employee),
        };
      },
      { employeeId },
    );
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}

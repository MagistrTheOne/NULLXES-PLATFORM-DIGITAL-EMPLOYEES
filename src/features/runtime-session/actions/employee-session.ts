"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { generateScenarioDebrief } from "@/features/scenarios/services/generate-scenario-debrief";
import {
  findScenarioSessionByTalkSessionId,
  linkScenarioTalkSession,
} from "@/features/scenarios/services/scenario-session";
import { createAnamTalkSessionTokenForEmployee } from "../services/create-anam-talk-session";
import type { TalkApiErrorCode } from "../lib/talk-api-errors";
import { EmployeeSessionLimitError } from "../lib/employee-session-limit";
import { resolveTalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { getEmployeeTalkContext } from "../services/get-employee-talk-context";
import { measureTalkPerf } from "../lib/talk-perf-log";
import {
  activateEmployeeSession,
  completeEmployeeSession,
  failEmployeeSession,
  failOpenEmployeeSessionsForTalkStart,
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
  const row = await activateEmployeeSession({ sessionId, organizationId, userId });

  if (row) {
    const { warmTalkSessionBrainCache } = await import(
      "../services/talk-session-brain-cache"
    );
    await warmTalkSessionBrainCache({
      sessionId,
      organizationId,
      employeeId: row.employeeId,
    }).catch(() => undefined);
  }
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
    const scenarioSession = await findScenarioSessionByTalkSessionId(sessionId);
    if (scenarioSession) {
      try {
        await generateScenarioDebrief({
          scenarioSessionId: scenarioSession.id,
          organizationId,
          userId,
        });
      } catch {
        // Debrief generation is best-effort; talk session completion already persisted.
      }
    }

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

export type SetSessionMessageFeedbackResult =
  | { ok: true }
  | { ok: false; message: string };

export async function setSessionMessageFeedbackAction(input: {
  streamMessageId: string;
  feedback: "up" | "down" | null;
}): Promise<SetSessionMessageFeedbackResult> {
  try {
    const { organizationId, userId } = await resolveWorkspaceContext();
    const { setSessionMessageFeedback } = await import(
      "../services/set-session-message-feedback"
    );
    await setSessionMessageFeedback({
      streamMessageId: input.streamMessageId,
      organizationId,
      userId,
      feedback: input.feedback,
    });
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Feedback failed",
    };
  }
}

export type StartTalkSessionResult =
  | {
      ok: true;
      sessionId: string;
      sessionToken: string;
      voiceMode: "elevenlabs" | "anam";
    }
  | { ok: false; message: string; code?: TalkApiErrorCode };

export async function startTalkSessionAction(
  employeeId: string,
  scenarioSessionId?: string,
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
        // Drop prior open DB sessions so retries do not reuse a half-dead
        // row while still minting a fresh Anam engine session (concurrent cap).
        await failOpenEmployeeSessionsForTalkStart({ employeeId, userId });
        // Brief pause so Anam can release engine slots after tab/retry churn.
        await new Promise((resolve) => setTimeout(resolve, 400));

        const sessionId = await startEmployeeSession({
          organizationId,
          employeeId,
          userId,
        });

        if (scenarioSessionId) {
          await linkScenarioTalkSession({
            scenarioSessionId,
            organizationId,
            userId,
            talkSessionId: sessionId,
          });
        }

        let anamToken = await createAnamTalkSessionTokenForEmployee(
          organizationId,
          employeeId,
          employee,
        );

        // One more attempt after concurrent/quota: close leftovers, wait, remint.
        if (
          !anamToken.ok &&
          (anamToken.code === "PROVIDER_QUOTA" ||
            /concurrent/i.test(anamToken.message))
        ) {
          await failOpenEmployeeSessionsForTalkStart({ employeeId, userId });
          await new Promise((resolve) => setTimeout(resolve, 1_500));
          anamToken = await createAnamTalkSessionTokenForEmployee(
            organizationId,
            employeeId,
            employee,
          );
        }

        if (!anamToken.ok) {
          return {
            ok: false,
            message: anamToken.message,
            code: anamToken.code ?? "PROVIDER_UNAVAILABLE",
          };
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
    if (error instanceof EmployeeSessionLimitError) {
      return { ok: false, message: error.message, code: error.code };
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}

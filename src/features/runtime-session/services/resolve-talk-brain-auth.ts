import { and, eq } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { assertTalkMinutesBudget } from "@/features/billing/services/assert-talk-minutes-budget";
import {
  assertWorkspaceAccess,
  workspaceAccessDeniedMessage,
} from "@/features/workspace";
import { db } from "@/shared/db/client";
import { getEmployeeTalkContext } from "./get-employee-talk-context";
import { getEmployeeSessionLimitSeconds } from "./get-employee-session-limit";
import { validateEmployeeSessionAccess } from "./record-employee-session";

export type TalkBrainAuthContext = {
  organizationId: string;
  userId: string;
};

export type TalkBrainAuthResult =
  | { ok: true; auth: TalkBrainAuthContext }
  | { ok: false; status: number; error: string };

async function assertTalkSessionWithinLimit(input: {
  sessionId: string;
  employeeId: string;
}): Promise<TalkBrainAuthResult | null> {
  const [row] = await db
    .select({
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
    })
    .from(employeeSession)
    .where(eq(employeeSession.id, input.sessionId))
    .limit(1);

  if (!row) {
    return { ok: false, status: 403, error: "Invalid session" };
  }

  if (
    row.status === "completed" ||
    row.status === "failed" ||
    row.status === "expired"
  ) {
    return {
      ok: false,
      status: 403,
      error: "Talk session has ended",
    };
  }

  const limitSeconds = await getEmployeeSessionLimitSeconds(input.employeeId);
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - row.startedAt.getTime()) / 1000),
  );

  if (elapsedSeconds >= limitSeconds) {
    await db
      .update(employeeSession)
      .set({
        status: "expired",
        endedAt: new Date(),
        durationSeconds: limitSeconds,
      })
      .where(
        and(
          eq(employeeSession.id, input.sessionId),
          eq(employeeSession.status, row.status),
        ),
      );

    return {
      ok: false,
      status: 403,
      error: "Talk session time limit reached",
    };
  }

  return null;
}

export async function resolveTalkBrainAuth(input: {
  employeeId: string;
  sessionId?: string;
}): Promise<TalkBrainAuthResult> {
  const session = await getCurrentSession();
  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  try {
    assertWorkspaceAccess(workspace.permissions, "canOperateEmployees");
  } catch {
    return {
      ok: false,
      status: 403,
      error: workspaceAccessDeniedMessage("canOperateEmployees"),
    };
  }

  const talkContext = await getEmployeeTalkContext(
    workspace.organization.id,
    input.employeeId,
  );

  if (!talkContext) {
    return { ok: false, status: 404, error: "Employee not found" };
  }

  if (!talkContext.canTalk) {
    return {
      ok: false,
      status: 403,
      error: "Talk is not available for this employee",
    };
  }

  const talkBudget = await assertTalkMinutesBudget({
    organizationId: workspace.organization.id,
  });
  if (!talkBudget.ok) {
    return { ok: false, status: 403, error: talkBudget.message };
  }

  if (input.sessionId) {
    const sessionValid = await validateEmployeeSessionAccess({
      sessionId: input.sessionId,
      organizationId: workspace.organization.id,
      employeeId: input.employeeId,
      userId: session.user.id,
    });

    if (!sessionValid) {
      return { ok: false, status: 403, error: "Invalid session" };
    }

    const limitResult = await assertTalkSessionWithinLimit({
      sessionId: input.sessionId,
      employeeId: input.employeeId,
    });
    if (limitResult) {
      return limitResult;
    }
  }

  return {
    ok: true,
    auth: {
      organizationId: workspace.organization.id,
      userId: session.user.id,
    },
  };
}

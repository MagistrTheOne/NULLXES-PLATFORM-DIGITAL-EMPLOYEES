import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  assertWorkspaceAccess,
  workspaceAccessDeniedMessage,
} from "@/features/workspace";
import { getTalkSessionMetricsSnapshot } from "@/features/runtime-session/services/record-talk-session-turn";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const { sessionId } = await context.params;
  const trimmedSessionId = sessionId?.trim();

  if (!trimmedSessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  try {
    assertWorkspaceAccess(workspace.permissions, "canViewEmployees");
  } catch {
    return NextResponse.json(
      { error: workspaceAccessDeniedMessage("canViewEmployees") },
      { status: 403 },
    );
  }

  const [row] = await db
    .select({
      userId: employeeSession.userId,
      organizationId: employeeSession.organizationId,
    })
    .from(employeeSession)
    .where(
      and(
        eq(employeeSession.id, trimmedSessionId),
        eq(employeeSession.organizationId, workspace.organization.id),
      ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (row.userId !== session.user.id) {
    return NextResponse.json({ error: "Session access denied" }, { status: 403 });
  }

  const metrics = await getTalkSessionMetricsSnapshot(trimmedSessionId);
  return NextResponse.json(metrics);
}

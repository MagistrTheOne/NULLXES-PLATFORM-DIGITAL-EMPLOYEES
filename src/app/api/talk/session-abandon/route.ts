import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { completeEmployeeSession } from "@/features/runtime-session/services/record-employee-session";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = (await request.json()) as { sessionId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const organizationId = workspace.organization.id;

  try {
    const result = await completeEmployeeSession({
      sessionId,
      organizationId,
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json({ ok: true, alreadyClosed: true });
    }

    if (isInngestEnabledForSend()) {
      try {
        await inngest.send({
          name: "employee/session.completed",
          data: { sessionId, organizationId },
        });
      } catch {
        // Background job dispatch is best-effort.
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
        abandoned: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

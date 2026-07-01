import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  assertWorkspaceAccess,
  workspaceAccessDeniedMessage,
} from "@/features/workspace";
import { getEmployeeTalkContext } from "./get-employee-talk-context";
import { validateEmployeeSessionAccess } from "./record-employee-session";

export type TalkBrainAuthContext = {
  organizationId: string;
  userId: string;
};

export type TalkBrainAuthResult =
  | { ok: true; auth: TalkBrainAuthContext }
  | { ok: false; status: number; error: string };

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
    assertWorkspaceAccess(workspace.permissions, "canViewEmployees");
  } catch {
    return {
      ok: false,
      status: 403,
      error: workspaceAccessDeniedMessage("canViewEmployees"),
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
  }

  return {
    ok: true,
    auth: {
      organizationId: workspace.organization.id,
      userId: session.user.id,
    },
  };
}

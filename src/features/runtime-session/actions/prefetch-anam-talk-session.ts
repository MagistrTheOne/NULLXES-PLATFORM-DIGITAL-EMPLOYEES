"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { createAnamTalkSessionTokenForEmployee } from "../services/create-anam-talk-session";
import { getEmployeeTalkContext } from "../services/get-employee-talk-context";

export type PrefetchAnamTalkSessionResult =
  | { ok: true; sessionToken: string }
  | { ok: false; message: string };

export async function prefetchAnamTalkSessionAction(
  employeeId: string,
): Promise<PrefetchAnamTalkSessionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    const talkContext = await getEmployeeTalkContext(
      workspace.organization.id,
      employeeId,
    );

    if (!talkContext?.canTalk) {
      return { ok: false, message: "Talk is not available for this employee" };
    }

    const token = await createAnamTalkSessionTokenForEmployee(
      workspace.organization.id,
      employeeId,
      talkContext,
    );

    if (!token.ok) {
      return { ok: false, message: token.message };
    }

    return { ok: true, sessionToken: token.sessionToken };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}

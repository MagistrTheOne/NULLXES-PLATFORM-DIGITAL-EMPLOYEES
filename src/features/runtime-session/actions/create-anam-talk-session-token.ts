"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import {
  createAnamTalkSessionTokenForEmployee,
  type AnamTalkSessionTokenResult,
} from "@/features/runtime-session/services/create-anam-talk-session";

export type CreateAnamTalkSessionTokenResult = AnamTalkSessionTokenResult;

export async function createAnamTalkSessionToken(
  employeeId: string,
): Promise<CreateAnamTalkSessionTokenResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    return createAnamTalkSessionTokenForEmployee(
      workspace.organization.id,
      employeeId,
    );
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}

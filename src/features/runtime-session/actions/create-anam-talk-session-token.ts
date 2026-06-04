"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  createAnamTalkSessionTokenForEmployee,
  type AnamTalkSessionTokenResult,
} from "@/features/runtime-session/services/create-anam-talk-session";

export type CreateAnamTalkSessionTokenResult = AnamTalkSessionTokenResult;

export async function createAnamTalkSessionToken(
  employeeId: string,
): Promise<CreateAnamTalkSessionTokenResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  return createAnamTalkSessionTokenForEmployee(
    workspace.organization.id,
    employeeId,
  );
}

"use server";

import { isPlatformAdminEmail } from "@/features/admin/lib/is-platform-admin";
import { requireAuth } from "@/features/auth/services/require-auth";
import {
  closeOpenEmployeeSessions,
  countOpenEmployeeSessions,
} from "@/features/runtime-session/services/close-open-employee-sessions";

export type CloseOpenSessionsActionResult =
  | { ok: true; closedCount: number }
  | { ok: false; message: string };

export async function closeOpenSessionsAction(): Promise<CloseOpenSessionsActionResult> {
  const session = await requireAuth();

  if (!isPlatformAdminEmail(session.user.email)) {
    return { ok: false, message: "Platform administrator access required." };
  }

  const result = await closeOpenEmployeeSessions();

  return { ok: true, closedCount: result.closedCount };
}

export async function getPlatformOpenSessionCountAction(): Promise<number> {
  const session = await requireAuth();

  if (!isPlatformAdminEmail(session.user.email)) {
    return 0;
  }

  return countOpenEmployeeSessions();
}

"use server";

import { and, eq, gt, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { session } from "@/features/auth/schema";
import { requireAuth } from "@/features/auth/services/require-auth";
import { db } from "@/shared/db/client";

export async function revokeAuthSessionAction(
  sessionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const authSession = await requireAuth();

  const deleted = await db
    .delete(session)
    .where(and(eq(session.id, sessionId), eq(session.userId, authSession.user.id)))
    .returning({ id: session.id });

  if (deleted.length === 0) {
    return { ok: false, message: "Session not found." };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function revokeOtherAuthSessionsAction(
  currentSessionId: string,
): Promise<{ ok: true; revokedCount: number } | { ok: false; message: string }> {
  const authSession = await requireAuth();
  const now = new Date();

  const deleted = await db
    .delete(session)
    .where(
      and(
        eq(session.userId, authSession.user.id),
        ne(session.id, currentSessionId),
        gt(session.expiresAt, now),
      ),
    )
    .returning({ id: session.id });

  revalidatePath("/settings");
  return { ok: true, revokedCount: deleted.length };
}

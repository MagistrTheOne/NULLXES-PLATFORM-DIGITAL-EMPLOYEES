import { count, eq } from "drizzle-orm";
import { session } from "@/features/auth/schema";
import { db } from "@/shared/db/client";
import type { SecuritySnapshot } from "../types";

export async function getSecuritySnapshot(
  userId: string,
): Promise<SecuritySnapshot> {
  const [row] = await db
    .select({ total: count() })
    .from(session)
    .where(eq(session.userId, userId));

  return {
    activeAuthSessions: Number(row?.total ?? 0),
    apiKeysConfigured: false,
    twoFactorEnabled: false,
  };
}

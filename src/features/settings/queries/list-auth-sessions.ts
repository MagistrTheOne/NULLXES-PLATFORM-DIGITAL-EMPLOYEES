import { and, desc, eq, gt } from "drizzle-orm";
import { session } from "@/features/auth/schema";
import { db } from "@/shared/db/client";

export type AuthSessionRow = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
};

export async function listActiveAuthSessionsForUser(
  userId: string,
): Promise<AuthSessionRow[]> {
  const now = new Date();

  return db
    .select({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, now)))
    .orderBy(desc(session.createdAt));
}

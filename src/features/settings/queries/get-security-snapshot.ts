import { count, eq } from "drizzle-orm";
import { user } from "@/entities/user/schema";
import { session } from "@/features/auth/schema";
import { countActiveApiKeys } from "@/features/security/services/api-key";
import { db } from "@/shared/db/client";
import type { SecuritySnapshot } from "../types";

export async function getSecuritySnapshot(input: {
  userId: string;
  organizationId: string;
}): Promise<SecuritySnapshot> {
  const [sessionRow, userRow, apiKeyCount] = await Promise.all([
    db
      .select({ total: count() })
      .from(session)
      .where(eq(session.userId, input.userId)),
    db
      .select({ twoFactorEnabled: user.twoFactorEnabled })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1),
    countActiveApiKeys(input.organizationId),
  ]);

  return {
    activeAuthSessions: Number(sessionRow[0]?.total ?? 0),
    apiKeysConfigured: apiKeyCount > 0,
    twoFactorEnabled: userRow[0]?.twoFactorEnabled ?? false,
  };
}

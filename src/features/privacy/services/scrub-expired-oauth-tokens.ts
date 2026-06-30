import { and, isNotNull, lt, or } from "drizzle-orm";
import { account } from "@/features/auth/schema";
import { db } from "@/shared/db/client";

/** Clear expired OAuth tokens from Better Auth account rows (minimize plaintext exposure). */
export async function scrubExpiredOAuthTokens(): Promise<number> {
  const now = new Date();

  const scrubbed = await db
    .update(account)
    .set({
      accessToken: null,
      refreshToken: null,
      idToken: null,
      updatedAt: now,
    })
    .where(
      and(
        or(
          and(
            isNotNull(account.accessTokenExpiresAt),
            lt(account.accessTokenExpiresAt, now),
          ),
          and(
            isNotNull(account.refreshTokenExpiresAt),
            lt(account.refreshTokenExpiresAt, now),
          ),
        ),
        or(isNotNull(account.accessToken), isNotNull(account.refreshToken)),
      ),
    )
    .returning({ id: account.id });

  return scrubbed.length;
}

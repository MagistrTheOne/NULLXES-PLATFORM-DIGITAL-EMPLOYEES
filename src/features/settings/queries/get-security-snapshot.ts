import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { apiKey } from "@/entities/api-key/schema";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { user } from "@/entities/user/schema";
import { account, session } from "@/features/auth/schema";
import { countActiveApiKeys } from "@/features/security/services/api-key";
import { db } from "@/shared/db/client";
import { listActiveAuthSessionsForUser } from "./list-auth-sessions";
import type { SecuritySnapshot } from "../types";

export async function getSecuritySnapshot(input: {
  userId: string;
  organizationId: string;
  currentSessionId?: string | null;
}): Promise<SecuritySnapshot> {
  const now = new Date();
  const [sessionCountRow, userRow, credentialAccount, apiKeyCount, orgSettings, apiKeys, authSessions] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(session)
        .where(and(eq(session.userId, input.userId), gt(session.expiresAt, now))),
      db
        .select({ twoFactorEnabled: user.twoFactorEnabled })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1),
      db
        .select({ id: account.id })
        .from(account)
        .where(
          and(eq(account.userId, input.userId), eq(account.providerId, "credential")),
        )
        .limit(1),
      countActiveApiKeys(input.organizationId),
      ensureOrganizationSettings(input.organizationId),
      db
        .select({
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          scopes: apiKey.scopes,
          expiresAt: apiKey.expiresAt,
          lastUsedAt: apiKey.lastUsedAt,
          createdAt: apiKey.createdAt,
        })
        .from(apiKey)
        .where(
          and(
            eq(apiKey.organizationId, input.organizationId),
            isNull(apiKey.revokedAt),
          ),
        )
        .orderBy(desc(apiKey.createdAt)),
      listActiveAuthSessionsForUser(input.userId),
    ]);

  return {
    activeAuthSessions: Number(sessionCountRow[0]?.total ?? 0),
    currentSessionId: input.currentSessionId ?? null,
    authSessions: authSessions.map((row) => ({
      ...row,
      isCurrent: row.id === input.currentSessionId,
    })),
    apiKeysConfigured: apiKeyCount > 0,
    twoFactorEnabled: userRow[0]?.twoFactorEnabled ?? false,
    hasPasswordCredential: Boolean(credentialAccount[0]),
    requireTwoFactorForAdmins: orgSettings.requireTwoFactorForAdmins,
    outboundWebhookUrl: orgSettings.outboundWebhookUrl,
    outboundWebhookConfigured: Boolean(orgSettings.outboundWebhookUrl?.trim()),
    apiIpAllowlist: orgSettings.apiIpAllowlist,
    apiKeys: apiKeys.map((key) => ({
      ...key,
      scopes: key.scopes ?? [],
    })),
  };
}

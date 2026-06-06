import { and, count, desc, eq, isNull } from "drizzle-orm";
import { apiKey } from "@/entities/api-key/schema";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { user } from "@/entities/user/schema";
import { session } from "@/features/auth/schema";
import { countActiveApiKeys } from "@/features/security/services/api-key";
import { db } from "@/shared/db/client";
import type { SecuritySnapshot } from "../types";

export async function getSecuritySnapshot(input: {
  userId: string;
  organizationId: string;
}): Promise<SecuritySnapshot> {
  const [sessionRow, userRow, apiKeyCount, orgSettings, apiKeys] =
    await Promise.all([
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
      ensureOrganizationSettings(input.organizationId),
      db
        .select({
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
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
    ]);

  return {
    activeAuthSessions: Number(sessionRow[0]?.total ?? 0),
    apiKeysConfigured: apiKeyCount > 0,
    twoFactorEnabled: userRow[0]?.twoFactorEnabled ?? false,
    requireTwoFactorForAdmins: orgSettings.requireTwoFactorForAdmins,
    outboundWebhookUrl: orgSettings.outboundWebhookUrl,
    outboundWebhookConfigured: Boolean(orgSettings.outboundWebhookUrl?.trim()),
    apiIpAllowlist: orgSettings.apiIpAllowlist,
    apiKeys,
  };
}

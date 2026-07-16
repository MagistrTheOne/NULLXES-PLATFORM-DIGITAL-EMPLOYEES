"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { apiKey } from "@/entities/api-key/schema";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { withTenantContext } from "@/shared/db/with-tenant-context";

export type ApiKeyListItem = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export type ListApiKeysResult =
  | { ok: true; keys: ApiKeyListItem[] }
  | { ok: false; message: string };

export async function listApiKeysAction(): Promise<ListApiKeysResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to view API keys." };
  }

  const organizationId = workspace.organization.id;

  const keys = await withTenantContext(organizationId, async (tx) => {
    return tx
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
          eq(apiKey.organizationId, organizationId),
          isNull(apiKey.revokedAt),
        ),
      )
      .orderBy(desc(apiKey.createdAt));
  });

  return { ok: true, keys };
}

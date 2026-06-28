import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { apiKey } from "@/entities/api-key/schema";
import {
  API_SCOPES,
  type ApiScope,
  type ApiScopeBundleId,
  resolveApiScopeBundle,
} from "@/features/public-api/lib/api-scopes";
import { db } from "@/shared/db/client";

function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

const LEGACY_KEY_PREFIX = "nx_";
const LIVE_KEY_PREFIX = "nx_live_";

function normalizeScopes(scopes: string[] | null | undefined): ApiScope[] {
  if (!scopes?.length) {
    return [...API_SCOPES];
  }

  return scopes.filter((scope): scope is ApiScope =>
    (API_SCOPES as readonly string[]).includes(scope),
  );
}

export async function createApiKey(input: {
  organizationId: string;
  name: string;
  createdByUserId: string;
  scopeBundle: ApiScopeBundleId;
  expiresAt?: Date | null;
}): Promise<{ ok: true; rawKey: string; keyId: string } | { ok: false; message: string }> {
  const rawKey = `${LIVE_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  const keyPrefix = rawKey.slice(0, 16);
  const scopes = resolveApiScopeBundle(input.scopeBundle);

  const [row] = await db
    .insert(apiKey)
    .values({
      organizationId: input.organizationId,
      name: input.name.trim(),
      keyPrefix,
      keyHash: hashApiKey(rawKey),
      scopes,
      expiresAt: input.expiresAt ?? null,
      createdByUserId: input.createdByUserId,
    })
    .returning({ id: apiKey.id });

  if (!row) {
    return { ok: false, message: "Failed to create API key." };
  }

  return { ok: true, rawKey, keyId: row.id };
}

export async function countActiveApiKeys(organizationId: string): Promise<number> {
  const rows = await db
    .select({ id: apiKey.id })
    .from(apiKey)
    .where(
      and(
        eq(apiKey.organizationId, organizationId),
        isNull(apiKey.revokedAt),
      ),
    );

  return rows.length;
}

export async function verifyApiKey(
  rawKey: string,
): Promise<
  | {
      organizationId: string;
      keyId: string;
      createdByUserId: string;
      scopes: ApiScope[];
      expired: boolean;
    }
  | null
> {
  if (!rawKey.startsWith(LEGACY_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);
  const [row] = await db
    .select({
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      createdByUserId: apiKey.createdByUserId,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
    })
    .from(apiKey)
    .where(and(eq(apiKey.keyHash, keyHash), isNull(apiKey.revokedAt)))
    .limit(1);

  if (!row) {
    return null;
  }

  const expired = Boolean(row.expiresAt && row.expiresAt.getTime() <= Date.now());

  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, row.id));

  return {
    organizationId: row.organizationId,
    keyId: row.id,
    createdByUserId: row.createdByUserId,
    scopes: normalizeScopes(row.scopes),
    expired,
  };
}

export async function revokeApiKey(input: {
  organizationId: string;
  keyId: string;
}): Promise<void> {
  await db
    .update(apiKey)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiKey.id, input.keyId),
        eq(apiKey.organizationId, input.organizationId),
        isNull(apiKey.revokedAt),
      ),
    );
}

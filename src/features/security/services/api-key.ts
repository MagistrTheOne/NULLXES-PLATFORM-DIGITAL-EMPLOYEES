import { createHash, createHmac, randomBytes } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { apiKey } from "@/entities/api-key/schema";
import {
  API_SCOPES,
  type ApiScope,
  type ApiScopeBundleId,
  resolveApiScopeBundle,
} from "@/features/public-api/lib/api-scopes";
import {
  withRlsBypass,
  withTenantContext,
} from "@/shared/db/with-tenant-context";

/**
 * Key hashing.
 *
 * Plain SHA-256 of an API key is brute-forceable offline if the database
 * leaks (the `nx_live_` prefix narrows the search space). HMAC-SHA256 with a
 * server-side pepper (`API_KEY_PEPPER`, never stored in the DB) makes leaked
 * hashes useless without also compromising the app environment.
 *
 * Peppered hashes are stored with an `hmac1:` prefix. Legacy plain-SHA-256
 * hashes keep verifying and are upgraded in place on first successful use,
 * so setting the pepper requires no key re-issuance.
 */
const HMAC_HASH_PREFIX = "hmac1:";

function getApiKeyPepper(): string | null {
  return process.env.API_KEY_PEPPER?.trim() || null;
}

/** Fail closed in production — plain SHA-256 hashes are offline-bruteforceable. */
export function assertApiKeyPepperConfigured(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  if (!getApiKeyPepper()) {
    throw new Error(
      "API_KEY_PEPPER is required in production for Public API key hashing.",
    );
  }
}

function legacyHashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

function pepperedHashApiKey(rawKey: string, pepper: string): string {
  return (
    HMAC_HASH_PREFIX + createHmac("sha256", pepper).update(rawKey).digest("hex")
  );
}

function computeApiKeyHashes(rawKey: string): {
  /** Preferred hash for new keys and in-place upgrades. */
  primary: string;
  /** All hashes that may match rows written before/after the pepper rollout. */
  candidates: string[];
} {
  const legacy = legacyHashApiKey(rawKey);
  const pepper = getApiKeyPepper();

  if (!pepper) {
    return { primary: legacy, candidates: [legacy] };
  }

  const peppered = pepperedHashApiKey(rawKey, pepper);
  return { primary: peppered, candidates: [peppered, legacy] };
}

const LIVE_KEY_PREFIX = "nx_live_";

function normalizeScopes(scopes: string[] | null | undefined): ApiScope[] {
  if (!scopes?.length) {
    // Fail closed: empty / missing scopes must not escalate to full access.
    return [];
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

  const row = await withTenantContext(input.organizationId, async (tx) => {
    const [created] = await tx
      .insert(apiKey)
      .values({
        organizationId: input.organizationId,
        name: input.name.trim(),
        keyPrefix,
        keyHash: computeApiKeyHashes(rawKey).primary,
        scopes,
        expiresAt: input.expiresAt ?? null,
        createdByUserId: input.createdByUserId,
      })
      .returning({ id: apiKey.id });
    return created;
  });

  if (!row) {
    return { ok: false, message: "Failed to create API key." };
  }

  return { ok: true, rawKey, keyId: row.id };
}

export async function countActiveApiKeys(organizationId: string): Promise<number> {
  return withTenantContext(organizationId, async (tx) => {
    const rows = await tx
      .select({ id: apiKey.id })
      .from(apiKey)
      .where(
        and(
          eq(apiKey.organizationId, organizationId),
          isNull(apiKey.revokedAt),
        ),
      );

    return rows.length;
  });
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
  if (!rawKey.startsWith(LIVE_KEY_PREFIX)) {
    return null;
  }

  const { primary, candidates } = computeApiKeyHashes(rawKey);

  // Hash lookup has no org yet — bypass RLS for candidate match, then
  // touch lastUsed under tenant context once organizationId is known.
  const row = await withRlsBypass(async (tx) => {
    const [found] = await tx
      .select({
        id: apiKey.id,
        organizationId: apiKey.organizationId,
        createdByUserId: apiKey.createdByUserId,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        keyHash: apiKey.keyHash,
      })
      .from(apiKey)
      .where(and(inArray(apiKey.keyHash, candidates), isNull(apiKey.revokedAt)))
      .limit(1);
    return found ?? null;
  });

  if (!row) {
    return null;
  }

  const expired = Boolean(row.expiresAt && row.expiresAt.getTime() <= Date.now());

  await withTenantContext(row.organizationId, async (tx) => {
    await tx
      .update(apiKey)
      .set({
        lastUsedAt: new Date(),
        // Upgrade legacy SHA-256 rows to the peppered hash on first use.
        ...(row.keyHash !== primary ? { keyHash: primary } : {}),
      })
      .where(eq(apiKey.id, row.id));
  });

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
  await withTenantContext(input.organizationId, async (tx) => {
    await tx
      .update(apiKey)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(apiKey.id, input.keyId),
          eq(apiKey.organizationId, input.organizationId),
          isNull(apiKey.revokedAt),
        ),
      );
  });
}

import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { apiKey } from "@/entities/api-key/schema";
import { db } from "@/shared/db/client";

function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function createApiKey(input: {
  organizationId: string;
  name: string;
  createdByUserId: string;
}): Promise<{ ok: true; rawKey: string; keyId: string } | { ok: false; message: string }> {
  const rawKey = `nx_${randomBytes(24).toString("hex")}`;
  const keyPrefix = rawKey.slice(0, 12);

  const [row] = await db
    .insert(apiKey)
    .values({
      organizationId: input.organizationId,
      name: input.name.trim(),
      keyPrefix,
      keyHash: hashApiKey(rawKey),
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

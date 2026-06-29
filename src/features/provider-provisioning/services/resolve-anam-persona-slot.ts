import { eq } from "drizzle-orm";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import {
  getAnamApiKeyPool,
  type AnamApiKeySlot,
} from "@/shared/config/anam-api-pool";
import { db } from "@/shared/db/client";

/**
 * Anam quota is enforced per account (= per API key). Free/limited accounts
 * typically allow a single avatar/persona, so we spread personas across the
 * configured key pool instead of stacking them on one account.
 *
 * Override the per-key cap with ANAM_MAX_PERSONAS_PER_KEY (default 1).
 */
function getMaxPersonasPerKey(): number {
  const raw = process.env.ANAM_MAX_PERSONAS_PER_KEY?.trim();
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

/**
 * Picks the Anam key slot a new persona should be created on:
 * - prefers the first configured slot still under the per-key cap;
 * - if every slot is at capacity, falls back to the least-loaded slot so
 *   provisioning still proceeds (and quota fallback in the fetch pool kicks in).
 * Returns null when no Anam keys are configured.
 */
export async function resolveAnamPersonaSlot(input?: {
  excludeEmployeeId?: string;
}): Promise<AnamApiKeySlot | null> {
  const pool = getAnamApiKeyPool();
  if (pool.length === 0) {
    return null;
  }

  const configuredSlots = pool.map((entry) => entry.slot);
  const firstSlot = configuredSlots[0];

  const rows = await db
    .select({
      config: employeeProviderConfig.config,
      employeeId: employeeProviderConfig.employeeId,
    })
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.providerType, "avatar"));

  const counts = new Map<string, number>();
  for (const slot of configuredSlots) {
    counts.set(slot, 0);
  }

  for (const row of rows) {
    if (input?.excludeEmployeeId && row.employeeId === input.excludeEmployeeId) {
      continue;
    }

    const config = row.config as Record<string, unknown>;
    if (!config.personaId) {
      continue;
    }

    const metadata =
      (config.providerMetadata as Record<string, unknown> | undefined) ?? {};
    const slot =
      typeof metadata.anamApiKeySlot === "string"
        ? metadata.anamApiKeySlot
        : firstSlot;

    if (counts.has(slot)) {
      counts.set(slot, (counts.get(slot) ?? 0) + 1);
    }
  }

  const max = getMaxPersonasPerKey();

  for (const slot of configuredSlots) {
    if ((counts.get(slot) ?? 0) < max) {
      return slot;
    }
  }

  let leastLoaded = firstSlot;
  let leastLoadedCount = counts.get(firstSlot) ?? 0;
  for (const slot of configuredSlots) {
    const count = counts.get(slot) ?? 0;
    if (count < leastLoadedCount) {
      leastLoaded = slot;
      leastLoadedCount = count;
    }
  }

  return leastLoaded;
}

import "server-only";

import { desc, eq, inArray } from "drizzle-orm";
import { capsuleOpenEvent, rewardDefinition } from "@/entities/reward";
import type { CapsuleHistoryItem } from "@/features/capsules/components/capsules-screen";
import { db } from "@/shared/db/client";

export async function listCapsuleOpenHistory(
  organizationId: string,
  limit = 40,
): Promise<CapsuleHistoryItem[]> {
  const events = await db
    .select()
    .from(capsuleOpenEvent)
    .where(eq(capsuleOpenEvent.organizationId, organizationId))
    .orderBy(desc(capsuleOpenEvent.createdAt))
    .limit(limit);

  if (events.length === 0) {
    return [];
  }

  const slugs = [...new Set(events.map((e) => e.rewardSlug))];
  const defs = await db
    .select()
    .from(rewardDefinition)
    .where(inArray(rewardDefinition.slug, slugs));
  const bySlug = new Map(defs.map((d) => [d.slug, d]));

  return events
    .filter((event) => !event.rewardSlug.startsWith("__"))
    .map((event) => {
    const def = bySlug.get(event.rewardSlug);
    return {
      id: event.id,
      tierId: event.tierId,
      rewardSlug: event.rewardSlug,
      rewardName: def?.name ?? event.rewardSlug,
      rarity: def?.rarity ?? "core",
      source: event.source,
      createdAt: event.createdAt.toISOString(),
    };
  });
}

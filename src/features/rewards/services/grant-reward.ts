import "server-only";

import { and, eq, sql } from "drizzle-orm";
import {
  organizationRewardItem,
  rewardDefinition,
} from "@/entities/reward";
import type { CapsuleTierId, RewardRarity } from "@/features/rewards/lib/catalog";
import {
  pickRandomItem,
  rollRarity,
  TIER_RARITY_WEIGHTS,
} from "@/features/rewards/lib/drop-odds";
import { db } from "@/shared/db/client";

export type GrantedReward = {
  slug: string;
  name: string;
  rarity: RewardRarity;
};

/**
 * Roll rarity for tier, pick a catalog definition, increment org owned count.
 */
export async function grantRolledReward(input: {
  organizationId: string;
  tierId: CapsuleTierId;
}): Promise<GrantedReward | null> {
  const definitions = (
    await db.select().from(rewardDefinition)
  ).filter(
    (d) =>
      d.type !== "appearance" &&
      d.type !== "skill_chip" &&
      d.type !== "voice",
  );
  if (definitions.length === 0) {
    return null;
  }

  const weights = TIER_RARITY_WEIGHTS[input.tierId];
  let rarity = rollRarity(weights);
  let pool = definitions.filter((d) => d.rarity === rarity);

  // Fallback: widen pool if tier bias misses empty rarity buckets.
  if (pool.length === 0) {
    const ordered: RewardRarity[] = [
      "core",
      "professional",
      "premium",
      "executive",
      "founders",
    ];
    for (const candidate of ordered) {
      pool = definitions.filter((d) => d.rarity === candidate);
      if (pool.length > 0) {
        rarity = candidate;
        break;
      }
    }
  }

  const picked = pickRandomItem(pool);
  if (!picked) {
    return null;
  }

  await grantRewardSlug({
    organizationId: input.organizationId,
    rewardSlug: picked.slug,
  });

  return {
    slug: picked.slug,
    name: picked.name,
    rarity: picked.rarity,
  };
}

export async function grantRewardSlug(input: {
  organizationId: string;
  rewardSlug: string;
  amount?: number;
}): Promise<void> {
  const amount = input.amount ?? 1;
  const existing = await db
    .select()
    .from(organizationRewardItem)
    .where(
      and(
        eq(organizationRewardItem.organizationId, input.organizationId),
        eq(organizationRewardItem.rewardSlug, input.rewardSlug),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(organizationRewardItem)
      .set({
        ownedCount: sql`${organizationRewardItem.ownedCount} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(organizationRewardItem.id, existing[0].id));
    return;
  }

  await db.insert(organizationRewardItem).values({
    organizationId: input.organizationId,
    rewardSlug: input.rewardSlug,
    ownedCount: amount,
  });
}

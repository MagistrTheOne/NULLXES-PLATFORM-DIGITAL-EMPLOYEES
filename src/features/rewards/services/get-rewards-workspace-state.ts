import "server-only";

import { eq } from "drizzle-orm";
import {
  capsuleTier,
  organizationCapsuleHolding,
  organizationDailyCapsule,
  organizationRewardItem,
  rewardDefinition,
} from "@/entities/reward";
import {
  SEED_CAPSULE_OWNED,
  SEED_CAPSULE_TIERS,
  SEED_ORG_OWNED,
  SEED_REWARD_ITEMS,
  type CapsuleOffer,
  type CapsuleTierId,
  type RewardItem,
} from "@/features/rewards/lib/catalog";
import { linkedSkillSlugForChip } from "@/features/rewards/lib/skill-chip-links";
import { getCapsulePriceLabel } from "@/features/billing/config/capsule-pricing";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";

const DAY_MS = 24 * 60 * 60 * 1000;

let catalogSeedPromise: Promise<void> | null = null;

async function seedPlatformCatalogIfEmpty(): Promise<void> {
  const existing = await db
    .select({ slug: rewardDefinition.slug })
    .from(rewardDefinition);
  const known = new Set(existing.map((row) => row.slug));
  const missing = SEED_REWARD_ITEMS.filter((item) => !known.has(item.id));

  if (missing.length > 0) {
    await db.insert(rewardDefinition).values(
      missing.map((item) => {
        const sortOrder = SEED_REWARD_ITEMS.findIndex((row) => row.id === item.id);
        return {
          slug: item.id,
          name: item.name,
          type: item.type,
          rarity: item.rarity,
          description: item.description,
          compatible: item.compatible,
          boostLabel: item.boostLabel ?? null,
          featured: Boolean(item.featured),
          comingSoon: Boolean(item.comingSoon),
          sortOrder: sortOrder < 0 ? 0 : sortOrder,
        };
      }),
    );
  }

  const tiers = await db.select({ id: capsuleTier.id }).from(capsuleTier).limit(1);
  if (tiers.length === 0) {
    await db.insert(capsuleTier).values(
      SEED_CAPSULE_TIERS.map((tier) => ({
        id: tier.id,
        name: tier.name,
        priceKey: tier.priceKey,
        priceLabel: tier.priceLabel,
        blurb: tier.blurb,
        activateLabel: tier.activateLabel,
        rewardPreviewSlugs: tier.rewardPreviewIds,
        isStore: Boolean(tier.store),
        isDaily: Boolean(tier.daily),
        isFeatured: Boolean(tier.featured),
        sortOrder: tier.sortOrder,
      })),
    );
  }
}

export async function ensureRewardsCatalogSeeded(): Promise<void> {
  if (!catalogSeedPromise) {
    catalogSeedPromise = seedPlatformCatalogIfEmpty().catch((error) => {
      catalogSeedPromise = null;
      throw error;
    });
  }
  await catalogSeedPromise;
}

async function ensureOrgRewardsBootstrapped(
  organizationId: string,
): Promise<void> {
  const owned = await db
    .select({ id: organizationRewardItem.id })
    .from(organizationRewardItem)
    .where(eq(organizationRewardItem.organizationId, organizationId))
    .limit(1);

  if (owned.length === 0) {
    const rows = Object.entries(SEED_ORG_OWNED).map(([rewardSlug, ownedCount]) => ({
      organizationId,
      rewardSlug,
      ownedCount,
    }));
    if (rows.length > 0) {
      await db.insert(organizationRewardItem).values(rows);
    }
  }

  const holdings = await db
    .select({ id: organizationCapsuleHolding.id })
    .from(organizationCapsuleHolding)
    .where(eq(organizationCapsuleHolding.organizationId, organizationId))
    .limit(1);

  if (holdings.length === 0) {
    await db.insert(organizationCapsuleHolding).values(
      (Object.keys(SEED_CAPSULE_OWNED) as CapsuleTierId[]).map((tierId) => ({
        organizationId,
        tierId,
        ownedCount: SEED_CAPSULE_OWNED[tierId] ?? 0,
      })),
    );
  }

  const daily = await db
    .select({ id: organizationDailyCapsule.id })
    .from(organizationDailyCapsule)
    .where(eq(organizationDailyCapsule.organizationId, organizationId))
    .limit(1);

  if (daily.length === 0) {
    const now = Date.now();
    // Match prior mock UX: already claimed, ~19h remaining on first load.
    const nextAvailableAt = new Date(now + 19 * 3600 * 1000 + 32 * 60 * 1000);
    await db.insert(organizationDailyCapsule).values({
      organizationId,
      lastClaimedAt: new Date(now - (DAY_MS - (nextAvailableAt.getTime() - now))),
      nextAvailableAt,
    });
  }
}

function secondsUntil(date: Date | null | undefined, now = Date.now()): number {
  if (!date) return 0;
  return Math.max(0, Math.floor((date.getTime() - now) / 1000));
}

export type RewardsWorkspaceState = {
  offers: CapsuleOffer[];
  rewards: RewardItem[];
  dailySecondsLeft: number;
};

export async function getRewardsWorkspaceState(
  organizationId: string,
): Promise<RewardsWorkspaceState> {
  return withDatabaseRetry(async () => {
    await ensureRewardsCatalogSeeded();
    await ensureOrgRewardsBootstrapped(organizationId);

    const [definitions, tiers, ownedRows, holdingRows, dailyRows] =
      await Promise.all([
        db
          .select()
          .from(rewardDefinition)
          .orderBy(rewardDefinition.sortOrder),
        db.select().from(capsuleTier).orderBy(capsuleTier.sortOrder),
        db
          .select()
          .from(organizationRewardItem)
          .where(eq(organizationRewardItem.organizationId, organizationId)),
        db
          .select()
          .from(organizationCapsuleHolding)
          .where(eq(organizationCapsuleHolding.organizationId, organizationId)),
        db
          .select()
          .from(organizationDailyCapsule)
          .where(eq(organizationDailyCapsule.organizationId, organizationId))
          .limit(1),
      ]);

    const ownedBySlug = new Map(
      ownedRows.map((row) => [row.rewardSlug, row.ownedCount]),
    );
    const holdingsByTier = new Map(
      holdingRows.map((row) => [row.tierId, row.ownedCount]),
    );

    const daily = dailyRows[0];
    const now = Date.now();
    const dailySecondsLeft = secondsUntil(daily?.nextAvailableAt ?? null, now);
    const dailyClaimed = dailySecondsLeft > 0;

    const rewards: RewardItem[] = definitions.map((row) => ({
      id: row.slug,
      name: row.name,
      type: row.type,
      rarity: row.rarity,
      description: row.description,
      compatible: row.compatible,
      boostLabel: row.boostLabel ?? undefined,
      linkedSkillSlug: linkedSkillSlugForChip(row.slug) ?? undefined,
      featured: row.featured,
      comingSoon: row.comingSoon,
      owned: ownedBySlug.get(row.slug) ?? 0,
    }));

    const offers: CapsuleOffer[] = tiers.map((tier) => {
      const ownedCount = holdingsByTier.get(tier.id) ?? 0;
      const claimed = Boolean(tier.isDaily && dailyClaimed);
      let activateLabel = tier.activateLabel;
      if (claimed) {
        activateLabel = "Claimed";
      } else if (tier.isDaily) {
        activateLabel = "Claim";
      } else if (ownedCount > 0) {
        activateLabel = "Open";
      } else {
        activateLabel = "Activate";
      }

      return {
        id: tier.id,
        name: tier.name,
        priceKey: tier.priceKey,
        priceLabel: getCapsulePriceLabel(tier.id) ?? tier.priceLabel,
        blurb: tier.blurb,
        activateLabel,
        claimed,
        ownedCount,
        rewardPreviewIds: tier.rewardPreviewSlugs ?? [],
        store: tier.isStore,
        daily: tier.isDaily,
        featured: tier.isFeatured,
      };
    });

    return { offers, rewards, dailySecondsLeft };
  });
}

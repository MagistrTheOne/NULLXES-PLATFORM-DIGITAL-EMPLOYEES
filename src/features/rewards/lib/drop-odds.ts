import type { RewardRarity, CapsuleTierId } from "@/features/rewards/lib/catalog";

/** Display odds as numeric weights. */
export const RARITY_WEIGHTS: Record<RewardRarity, number> = {
  core: 60,
  professional: 25,
  premium: 10,
  executive: 4,
  founders: 1,
};

/** Per-tier rarity weights for opens. */
export const TIER_RARITY_WEIGHTS: Record<
  CapsuleTierId,
  Partial<Record<RewardRarity, number>>
> = {
  // Base / daily — core-heavy
  daily: {
    core: 70,
    professional: 22,
    premium: 6,
    executive: 1.5,
    founders: 0.5,
  },
  // Diamond — professional → premium skew, almost no core
  standard: {
    core: 5,
    professional: 45,
    premium: 35,
    executive: 12,
    founders: 3,
  },
  // Gold — premium floor; chance for executive / founders
  executive: {
    premium: 70,
    executive: 22,
    founders: 8,
  },
};

export function rollRarity(
  weights: Partial<Record<RewardRarity, number>>,
  random = Math.random,
): RewardRarity {
  const entries = (
    Object.entries(weights) as Array<[RewardRarity, number]>
  ).filter(([, w]) => w > 0);
  if (entries.length === 0) {
    return "core";
  }
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let cursor = random() * total;
  for (const [rarity, weight] of entries) {
    cursor -= weight;
    if (cursor <= 0) {
      return rarity;
    }
  }
  return entries[entries.length - 1]![0];
}

export function pickRandomItem<T>(items: T[], random = Math.random): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(random() * items.length)] ?? null;
}

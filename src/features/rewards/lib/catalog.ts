export type RewardRarity =
  | "core"
  | "professional"
  | "premium"
  | "executive"
  | "founders";

export type RewardType =
  | "skill_chip"
  | "appearance"
  | "voice"
  | "background"
  | "frame";

export type CapsulePriceKey = "free" | "99" | "4999";

export type CapsuleTierId = "daily" | "standard" | "executive";

export type RewardItem = {
  id: string;
  name: string;
  type: RewardType;
  rarity: RewardRarity;
  description: string;
  owned: number;
  compatible: string;
  boostLabel?: string;
  /** Maps skill_chip → Agent Blueprint system skill slug. */
  linkedSkillSlug?: string;
  comingSoon?: boolean;
  featured?: boolean;
};

export type CapsuleOffer = {
  id: CapsuleTierId;
  name: string;
  priceKey: CapsulePriceKey;
  priceLabel: string;
  blurb: string;
  activateLabel: string;
  claimed?: boolean;
  /** Owned / available in "My" / inventory-facing views */
  ownedCount?: number;
  rewardPreviewIds: string[];
  store?: boolean;
  daily?: boolean;
  featured?: boolean;
};

/** Empty arrays = no filter (show all). */
export type RewardsFilterState = {
  rarities: RewardRarity[];
  rewardTypes: RewardType[];
  prices: CapsulePriceKey[];
  query: string;
};

export const RARITY_STYLES: Record<
  RewardRarity,
  { border: string; text: string; label: string }
> = {
  core: {
    border: "border-white/25",
    text: "text-white/55",
    label: "Core",
  },
  professional: {
    border: "border-emerald-400/45",
    text: "text-emerald-300/80",
    label: "Professional",
  },
  premium: {
    border: "border-sky-400/45",
    text: "text-sky-300/80",
    label: "Premium",
  },
  executive: {
    border: "border-violet-400/45",
    text: "text-violet-300/80",
    label: "Executive",
  },
  founders: {
    border: "border-amber-400/50",
    text: "text-amber-300/90",
    label: "Founder's",
  },
};

export const RARITY_ODDS: Array<{ rarity: RewardRarity; percent: string }> = [
  { rarity: "core", percent: "60.000%" },
  { rarity: "professional", percent: "25.000%" },
  { rarity: "premium", percent: "10.000%" },
  { rarity: "executive", percent: "4.000%" },
  { rarity: "founders", percent: "1.000%" },
];

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  skill_chip: "Skill Chip",
  appearance: "Appearance",
  voice: "Voice Pack",
  background: "Background",
  frame: "Frame",
};

/**
 * Live catalog for capsules / inventory.
 * Appearance + skill_chip purged for now (restore when plates/chips ship).
 * PG enum values remain; do not seed those types.
 */
export const SEED_REWARD_ITEMS: Omit<RewardItem, "owned">[] = [
  {
    id: "exec-voice",
    name: "Executive Voice",
    type: "voice",
    rarity: "executive",
    description:
      "ElevenLabs voice pack — corporate tone. Equips male/female variant via Voice Design.",
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "board-room",
    name: "Board Room",
    type: "background",
    rarity: "premium",
    description: "Meeting-room backdrop for employee cards and Talk chrome.",
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "calm-voice",
    name: "Calm & Confident",
    type: "voice",
    rarity: "professional",
    description:
      "ElevenLabs voice pack — steady support tone. Male/female via Voice Design.",
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "minimal-frame",
    name: "Base Frame",
    type: "frame",
    rarity: "professional",
    description: "Clean white nameplate frame for employee cards.",
    compatible: "All Employees",
  },
  {
    id: "board-presence",
    name: "Board Presence",
    type: "voice",
    rarity: "professional",
    description:
      "ElevenLabs voice pack — measured leadership briefings. Male/female via Voice Design.",
    compatible: "All Employees",
  },
  {
    id: "office-soft",
    name: "Office Soft",
    type: "background",
    rarity: "core",
    description: "Soft office backdrop for cards and Talk chrome.",
    compatible: "All Employees",
  },
  {
    id: "thin-line",
    name: "Gold Frame",
    type: "frame",
    rarity: "executive",
    description: "Gold glow nameplate frame for executive presence.",
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "legendary-frame",
    name: "Legendary Frame",
    type: "frame",
    rarity: "founders",
    description: "Icy legendary bezel for founder-tier employee cards.",
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "briefing-tone",
    name: "Briefing Tone",
    type: "voice",
    rarity: "executive",
    description:
      "ElevenLabs voice pack — sharp status briefings. Male/female via Voice Design.",
    compatible: "All Employees",
  },
];

/** Default owned counts for first-time org bootstrap. */
export const SEED_ORG_OWNED: Record<string, number> = {
  "exec-voice": 1,
  "board-room": 1,
  "calm-voice": 1,
  "minimal-frame": 2,
  "board-presence": 1,
  "office-soft": 1,
  "thin-line": 1,
  "legendary-frame": 1,
};

export const SEED_CAPSULE_TIERS: Array<
  Omit<CapsuleOffer, "claimed" | "ownedCount" | "activateLabel"> & {
    activateLabel: string;
    sortOrder: number;
  }
> = [
  {
    id: "daily",
    name: "Base Capsule",
    priceKey: "free",
    priceLabel: "Free",
    blurb: "Daily Base drop — Core rewards for steady progress.",
    activateLabel: "Claim",
    rewardPreviewIds: ["office-soft", "minimal-frame", "calm-voice"],
    daily: true,
    featured: true,
    sortOrder: 0,
  },
  {
    id: "standard",
    name: "Diamond Capsule",
    priceKey: "99",
    priceLabel: "10 ₽",
    blurb: "Diamond tier — high chance for Professional or Premium rewards.",
    activateLabel: "Activate",
    rewardPreviewIds: ["board-room", "calm-voice", "thin-line"],
    store: true,
    featured: true,
    sortOrder: 1,
  },
  {
    id: "executive",
    name: "Gold Capsule",
    priceKey: "4999",
    priceLabel: "10 ₽",
    blurb: "Legendary Gold — guaranteed Premium. Chance for Executive or Founder's.",
    activateLabel: "Activate",
    rewardPreviewIds: ["exec-voice", "legendary-frame", "briefing-tone"],
    store: true,
    featured: true,
    sortOrder: 2,
  },
];

export const SEED_CAPSULE_OWNED: Record<CapsuleTierId, number> = {
  daily: 1,
  standard: 2,
  executive: 0,
};

/** @deprecated Use SEED_REWARD_ITEMS + owned merge */
export const MOCK_REWARD_ITEMS: RewardItem[] = SEED_REWARD_ITEMS.map((item) => ({
  ...item,
  owned: SEED_ORG_OWNED[item.id] ?? 0,
}));

/** @deprecated Use live CapsuleOffer from services */
export const MOCK_CAPSULE_OFFERS: CapsuleOffer[] = SEED_CAPSULE_TIERS.map(
  (tier) => ({
    ...tier,
    ownedCount: SEED_CAPSULE_OWNED[tier.id] ?? 0,
    claimed: tier.id === "daily",
    activateLabel: tier.id === "daily" ? "Claimed" : tier.activateLabel,
  }),
);

export const MOCK_EMPLOYEE_TARGETS = [
  { id: "adeline", name: "Adeline Kalen" },
  { id: "somnia", name: "Somnia" },
  { id: "yuki", name: "Yuki Nakora" },
  { id: "anna", name: "Anna" },
  { id: "kaira", name: "Kaira NULLXES" },
] as const;

export const DEFAULT_REWARDS_FILTER: RewardsFilterState = {
  rarities: [],
  rewardTypes: [],
  prices: [],
  query: "",
};

export function activeFilterCount(filter: RewardsFilterState): number {
  return (
    filter.rarities.length +
    filter.rewardTypes.length +
    filter.prices.length
  );
}

export function getRewardById(
  id: string,
  catalog: RewardItem[] = MOCK_REWARD_ITEMS,
): RewardItem | undefined {
  return catalog.find((item) => item.id === id);
}

export function getCollectionProgress(items: RewardItem[]) {
  const ownedItems = items.filter((item) => item.owned > 0);
  const owned = ownedItems.length;
  const total = Math.max(items.length, 1);
  const completion = Math.round((owned / total) * 100);
  const executiveOwned = ownedItems.filter((i) => i.rarity === "executive").length;
  const foundersOwned = ownedItems.filter((i) => i.rarity === "founders").length;

  return {
    owned,
    total,
    completion,
    executiveOwned,
    foundersOwned,
  };
}

function matchesQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q);
}

export function filterRewards(
  items: RewardItem[],
  filter: RewardsFilterState,
): RewardItem[] {
  return items.filter((item) => {
    if (filter.rarities.length > 0 && !filter.rarities.includes(item.rarity)) {
      return false;
    }
    if (
      filter.rewardTypes.length > 0 &&
      !filter.rewardTypes.includes(item.type)
    ) {
      return false;
    }
    if (!matchesQuery(item.name, filter.query)) return false;
    return true;
  });
}

export function filterCapsules(
  offers: CapsuleOffer[],
  filter: RewardsFilterState,
  rewards: RewardItem[],
): CapsuleOffer[] {
  const byId = new Map(rewards.map((r) => [r.id, r]));

  return offers.filter((offer) => {
    if (
      filter.prices.length > 0 &&
      !filter.prices.includes(offer.priceKey)
    ) {
      return false;
    }
    if (!matchesQuery(offer.name, filter.query)) return false;

    const previewRewards = offer.rewardPreviewIds
      .map((id) => byId.get(id))
      .filter(Boolean) as RewardItem[];

    if (filter.rarities.length > 0) {
      const hasRarity = previewRewards.some((r) =>
        filter.rarities.includes(r.rarity),
      );
      if (!hasRarity) return false;
    }

    if (filter.rewardTypes.length > 0) {
      const hasType = previewRewards.some((r) =>
        filter.rewardTypes.includes(r.type),
      );
      if (!hasType) return false;
    }

    return true;
  });
}

export function toggleFilterValue<T extends string>(
  list: T[],
  value: T,
): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

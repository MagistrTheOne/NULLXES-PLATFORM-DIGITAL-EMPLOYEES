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
  | "idle"
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
  voice: "Voice",
  idle: "Idle Animation",
  background: "Background",
  frame: "Frame",
};

/** Seed / fallback catalog (also source for DB seed). */
export const SEED_REWARD_ITEMS: Omit<RewardItem, "owned">[] = [
  {
    id: "exec-black",
    name: "Executive Black",
    type: "appearance",
    rarity: "founders",
    description:
      "A signature look for elite performers. Crafted for leadership. Worn by founders.",
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "neg-mastery",
    name: "Negotiation Mastery",
    type: "skill_chip",
    rarity: "executive",
    description: "Narrow boost for negotiation scenarios.",
    compatible: "All Employees",
    boostLabel: "+15%",
    featured: true,
  },
  {
    id: "exec-voice",
    name: "Executive Voice",
    type: "voice",
    rarity: "executive",
    description: "Corporate tone pack for executive presence.",
    compatible: "All Employees",
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
    id: "sales-eff",
    name: "Sales Efficiency",
    type: "skill_chip",
    rarity: "premium",
    description: "Focused sales throughput modifier.",
    compatible: "All Employees",
    boostLabel: "+8%",
  },
  {
    id: "calm-voice",
    name: "Calm & Confident",
    type: "voice",
    rarity: "professional",
    description: "Steady delivery for support and reception roles.",
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "minimal-frame",
    name: "Minimalist Frame",
    type: "frame",
    rarity: "professional",
    description: "Clean nameplate frame for employee cards.",
    compatible: "All Employees",
  },
  {
    id: "knowledge-recall",
    name: "Knowledge Recall",
    type: "skill_chip",
    rarity: "core",
    description: "Light boost to knowledge retrieval in Talk.",
    compatible: "All Employees",
    boostLabel: "+12%",
  },
  {
    id: "classic-idle",
    name: "Classic Idle",
    type: "idle",
    rarity: "core",
    description: "Default standing idle pose.",
    compatible: "All Employees",
  },
  {
    id: "support-spec",
    name: "Support Specialist",
    type: "skill_chip",
    rarity: "core",
    description: "Support-domain efficiency chip.",
    compatible: "All Employees",
    boostLabel: "+6%",
  },
  {
    id: "board-presence",
    name: "Board Presence",
    type: "voice",
    rarity: "professional",
    description: "Measured delivery for leadership briefings.",
    compatible: "All Employees",
  },
  {
    id: "quiet-focus",
    name: "Quiet Focus",
    type: "idle",
    rarity: "professional",
    description: "Subtle idle for analytical roles.",
    compatible: "All Employees",
  },
  // Beta gap-fillers — slot coverage for drop tests (assets later).
  {
    id: "studio-neutral",
    name: "Studio Neutral",
    type: "appearance",
    rarity: "professional",
    description: "Clean studio look for day-to-day workforce presence.",
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
    name: "Thin Line",
    type: "frame",
    rarity: "core",
    description: "Hairline nameplate frame for employee cards.",
    compatible: "All Employees",
  },
  {
    id: "measured-pace",
    name: "Measured Pace",
    type: "idle",
    rarity: "premium",
    description: "Composed idle cadence for premium presence.",
    compatible: "All Employees",
  },
  {
    id: "briefing-tone",
    name: "Briefing Tone",
    type: "voice",
    rarity: "executive",
    description: "Sharp briefing delivery for leadership updates.",
    compatible: "All Employees",
  },
];

/** Default owned counts for first-time org bootstrap. */
export const SEED_ORG_OWNED: Record<string, number> = {
  "exec-black": 1,
  "neg-mastery": 2,
  "exec-voice": 1,
  "board-room": 1,
  "sales-eff": 3,
  "calm-voice": 1,
  "minimal-frame": 2,
  "knowledge-recall": 4,
  "classic-idle": 1,
  "support-spec": 2,
  "board-presence": 1,
  "quiet-focus": 1,
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
    rewardPreviewIds: ["knowledge-recall", "office-soft", "thin-line"],
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
    rewardPreviewIds: ["studio-neutral", "calm-voice", "sales-eff"],
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
    rewardPreviewIds: ["exec-black", "measured-pace", "briefing-tone"],
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

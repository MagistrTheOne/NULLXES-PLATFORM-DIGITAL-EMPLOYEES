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

export type RewardsFilterState = {
  rarity: "all" | RewardRarity;
  rewardType: "all" | RewardType;
  price: "all" | CapsulePriceKey;
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

export const MOCK_REWARD_ITEMS: RewardItem[] = [
  {
    id: "exec-black",
    name: "Executive Black",
    type: "appearance",
    rarity: "founders",
    description:
      "A signature look for elite performers. Crafted for leadership. Worn by founders.",
    owned: 1,
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "neg-mastery",
    name: "Negotiation Mastery",
    type: "skill_chip",
    rarity: "executive",
    description: "Narrow boost for negotiation scenarios.",
    owned: 2,
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
    owned: 1,
    compatible: "All Employees",
  },
  {
    id: "board-room",
    name: "Board Room",
    type: "background",
    rarity: "premium",
    description: "Meeting-room backdrop for employee cards and Talk chrome.",
    owned: 1,
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "sales-eff",
    name: "Sales Efficiency",
    type: "skill_chip",
    rarity: "premium",
    description: "Focused sales throughput modifier.",
    owned: 3,
    compatible: "All Employees",
    boostLabel: "+8%",
  },
  {
    id: "calm-voice",
    name: "Calm & Confident",
    type: "voice",
    rarity: "professional",
    description: "Steady delivery for support and reception roles.",
    owned: 1,
    compatible: "All Employees",
    featured: true,
  },
  {
    id: "minimal-frame",
    name: "Minimalist Frame",
    type: "frame",
    rarity: "professional",
    description: "Clean nameplate frame for employee cards.",
    owned: 2,
    compatible: "All Employees",
  },
  {
    id: "knowledge-recall",
    name: "Knowledge Recall",
    type: "skill_chip",
    rarity: "core",
    description: "Light boost to knowledge retrieval in Talk.",
    owned: 4,
    compatible: "All Employees",
    boostLabel: "+12%",
  },
  {
    id: "classic-idle",
    name: "Classic Idle",
    type: "idle",
    rarity: "core",
    description: "Default standing idle pose.",
    owned: 1,
    compatible: "All Employees",
  },
  {
    id: "support-spec",
    name: "Support Specialist",
    type: "skill_chip",
    rarity: "core",
    description: "Support-domain efficiency chip.",
    owned: 2,
    compatible: "All Employees",
    boostLabel: "+6%",
  },
  {
    id: "board-presence",
    name: "Board Presence",
    type: "voice",
    rarity: "professional",
    description: "Measured delivery for leadership briefings.",
    owned: 1,
    compatible: "All Employees",
  },
  {
    id: "quiet-focus",
    name: "Quiet Focus",
    type: "idle",
    rarity: "professional",
    description: "Subtle idle for analytical roles.",
    owned: 1,
    compatible: "All Employees",
  },
];

export const MOCK_CAPSULE_OFFERS: CapsuleOffer[] = [
  {
    id: "daily",
    name: "Free Daily",
    priceKey: "free",
    priceLabel: "Free",
    blurb: "Core rewards to support your daily progress.",
    activateLabel: "Claimed",
    claimed: true,
    ownedCount: 1,
    rewardPreviewIds: ["knowledge-recall", "classic-idle", "support-spec"],
    daily: true,
    featured: true,
  },
  {
    id: "standard",
    name: "Standard Capsule",
    priceKey: "99",
    priceLabel: "99 ₽",
    blurb: "High chance for Professional or Premium rewards.",
    activateLabel: "Activate",
    ownedCount: 2,
    rewardPreviewIds: ["sales-eff", "calm-voice", "minimal-frame"],
    store: true,
    featured: true,
  },
  {
    id: "executive",
    name: "Executive Capsule",
    priceKey: "4999",
    priceLabel: "4 999 ₽",
    blurb: "Guaranteed Premium. Chance for Executive or Founder's.",
    activateLabel: "Activate",
    ownedCount: 0,
    rewardPreviewIds: ["exec-black", "neg-mastery", "exec-voice"],
    store: true,
    featured: true,
  },
];

/** Mock catalog size for Collection Progress (expandable later). */
export const MOCK_COLLECTION_TOTAL = 85;

export const MOCK_EMPLOYEE_TARGETS = [
  { id: "adeline", name: "Adeline Kalen" },
  { id: "somnia", name: "Somnia" },
  { id: "yuki", name: "Yuki Nakora" },
  { id: "anna", name: "Anna" },
  { id: "kaira", name: "Kaira NULLXES" },
] as const;

export const DEFAULT_REWARDS_FILTER: RewardsFilterState = {
  rarity: "all",
  rewardType: "all",
  price: "all",
  query: "",
};

export function getRewardById(id: string): RewardItem | undefined {
  return MOCK_REWARD_ITEMS.find((item) => item.id === id);
}

export function getCollectionProgress(items: RewardItem[] = MOCK_REWARD_ITEMS) {
  const ownedItems = items.filter((item) => item.owned > 0);
  const owned = ownedItems.length;
  const total = MOCK_COLLECTION_TOTAL;
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
    if (filter.rarity !== "all" && item.rarity !== filter.rarity) return false;
    if (filter.rewardType !== "all" && item.type !== filter.rewardType) {
      return false;
    }
    if (!matchesQuery(item.name, filter.query)) return false;
    return true;
  });
}

export function filterCapsules(
  offers: CapsuleOffer[],
  filter: RewardsFilterState,
): CapsuleOffer[] {
  return offers.filter((offer) => {
    if (filter.price !== "all" && offer.priceKey !== filter.price) return false;
    if (!matchesQuery(offer.name, filter.query)) return false;

    const previewRewards = offer.rewardPreviewIds
      .map((id) => getRewardById(id))
      .filter(Boolean) as RewardItem[];

    if (filter.rarity !== "all") {
      const hasRarity = previewRewards.some((r) => r.rarity === filter.rarity);
      if (!hasRarity) return false;
    }

    if (filter.rewardType !== "all") {
      const hasType = previewRewards.some((r) => r.type === filter.rewardType);
      if (!hasType) return false;
    }

    return true;
  });
}

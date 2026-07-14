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

export type RewardItem = {
  id: string;
  name: string;
  type: RewardType;
  rarity: RewardRarity;
  description: string;
  owned: number;
  compatible: string;
  /** Mock property for skill chips */
  boostLabel?: string;
  comingSoon?: boolean;
};

export type CapsuleTierId = "daily" | "standard" | "executive";

export type CapsuleOffer = {
  id: CapsuleTierId;
  name: string;
  priceLabel: string;
  blurb: string;
  activateLabel: string;
  claimed?: boolean;
  rewardPreviewIds: string[];
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
];

export const MOCK_CAPSULE_OFFERS: CapsuleOffer[] = [
  {
    id: "daily",
    name: "Free Daily",
    priceLabel: "Free",
    blurb: "Core rewards to support your daily progress.",
    activateLabel: "Claimed",
    claimed: true,
    rewardPreviewIds: ["knowledge-recall", "classic-idle", "support-spec"],
  },
  {
    id: "standard",
    name: "Standard Capsule",
    priceLabel: "99 ₽",
    blurb: "High chance for Professional or Premium rewards.",
    activateLabel: "Activate",
    rewardPreviewIds: ["sales-eff", "calm-voice", "minimal-frame"],
  },
  {
    id: "executive",
    name: "Executive Capsule",
    priceLabel: "4 999 ₽",
    blurb: "Guaranteed Premium. Chance for Executive or Founder's.",
    activateLabel: "Activate",
    rewardPreviewIds: ["exec-black", "neg-mastery", "exec-voice"],
  },
];

export const MOCK_EMPLOYEE_TARGETS = [
  { id: "adeline", name: "Adeline Kalen" },
  { id: "somnia", name: "Somnia" },
  { id: "yuki", name: "Yuki Nakora" },
] as const;

export function getRewardById(id: string): RewardItem | undefined {
  return MOCK_REWARD_ITEMS.find((item) => item.id === id);
}

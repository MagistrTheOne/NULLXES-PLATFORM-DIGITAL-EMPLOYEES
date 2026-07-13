import type { BillingInterval, BillingPlanId } from "./plans";

export type PricingTierId =
  | "free"
  | "starter"
  | "studio"
  | "operator"
  | "scale"
  | "discovery"
  | "pilot"
  | "department"
  | "holding"
  | "flagship";

export type PricingTierEngagement = "self_serve" | "sales";

export type PricingTier = {
  id: PricingTierId;
  name: string;
  priceLabel: string;
  priceNote: string;
  priceLabelAnnual?: string;
  priceNoteAnnual?: string;
  description: string;
  engagement: PricingTierEngagement;
  flagship: boolean;
  recommended?: boolean;
  features: string[];
};

/**
 * Marketing catalog. DB plan id `operator` is displayed as Team.
 * Self-serve CTA: Subscribe / Оформить подписку.
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "0 ₽",
    priceNote: "No credit card",
    description: "Talk with NULLXES catalog employees. Build your own on paid plans.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "NULLXES catalog: Adeline + Yuki",
      "30 Talk minutes / month",
      "AI chat",
      "No custom employees",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "599 ₽",
    priceNote: "per month",
    priceLabelAnnual: "5 759 ₽",
    priceNoteAnnual: "per year · save 20%",
    description: "NULLXES catalog plus your first custom digital employees.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "NULLXES catalog: Adeline + Yuki",
      "2 custom digital employees",
      "Up to 60 Talk minutes / month",
      "Up to 10 knowledge sources",
      "1 personal avatar",
      "Dialog history",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    priceLabel: "4 999 ₽",
    priceNote: "per month",
    priceLabelAnnual: "47 999 ₽",
    priceNoteAnnual: "per year · save 20%",
    description: "Starter catalog access with room for a personal digital team.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "NULLXES starter catalog",
      "5 custom digital employees",
      "Up to 180 Talk minutes / month",
      "Expanded knowledge base",
      "Unrestricted personal avatar",
      "History and dialog search",
    ],
  },
  {
    id: "operator",
    name: "Team",
    priceLabel: "19 999 ₽",
    priceNote: "per month",
    priceLabelAnnual: "191 999 ₽",
    priceNoteAnnual: "per year · save 20%",
    description: "A digital team with extended catalog and first integrations.",
    engagement: "self_serve",
    flagship: false,
    recommended: true,
    features: [
      "Extended NULLXES catalog",
      "10 custom digital employees",
      "Up to 600 Talk minutes / month",
      "Shared workspace",
      "Shared knowledge base",
      "Read API",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    priceLabel: "59 999 ₽",
    priceNote: "per month",
    priceLabelAnnual: "575 999 ₽",
    priceNoteAnnual: "per year · save 20%",
    description:
      "Full catalog access for companies growing a digital workforce.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "Full NULLXES catalog",
      "20+ custom digital employees",
      "Up to 2 000 Talk minutes / month",
      "Full API",
      "Multiple avatars and roles",
      "Priority support",
    ],
  },
  {
    id: "discovery",
    name: "Discovery",
    priceLabel: "Contact sales",
    priceNote: "",
    description:
      "Processes, architecture, and a digital employee deployment plan.",
    engagement: "sales",
    flagship: false,
    features: [
      "Business process analysis",
      "Automation map",
      "1–2 working prototypes",
      "NULLXES deployment architect",
    ],
  },
  {
    id: "pilot",
    name: "Pilot",
    priceLabel: "Contact sales",
    priceNote: "",
    description:
      "First digital employees in the company’s operating environment.",
    engagement: "sales",
    flagship: false,
    features: [
      "3–10 digital employees",
      "Custom avatars and voices",
      "Corporate systems integration",
      "Metrics and reporting",
    ],
  },
  {
    id: "department",
    name: "Digital department",
    priceLabel: "Contact sales",
    priceNote: "",
    description:
      "A business unit run by digital employees under unified control.",
    engagement: "sales",
    flagship: false,
    features: [
      "Unit automation",
      "Role and access control",
      "Analytics and activity log",
      "SSO and priority support",
    ],
  },
  {
    id: "holding",
    name: "Digital holding",
    priceLabel: "Contact sales",
    priceNote: "",
    description: "Manage digital employees across multiple organizations.",
    engagement: "sales",
    flagship: false,
    features: [
      "Multiple organizations",
      "Hundreds of digital employees",
      "Data security requirements",
      "Dedicated engineering team and SLA",
    ],
  },
  {
    id: "flagship",
    name: "Digital corporation",
    priceLabel: "Contact sales",
    priceNote: "",
    description: "NULLXES platform on private infrastructure.",
    engagement: "sales",
    flagship: true,
    features: [
      "Private digital corporation",
      "Private infrastructure",
      "Custom AI models and services",
      "Dedicated NULLXES team",
    ],
  },
];

export function getGridPricingTiers(): PricingTier[] {
  return PRICING_TIERS.filter((tier) => !tier.flagship);
}

export function getSelfServePricingTiers(): PricingTier[] {
  return PRICING_TIERS.filter(
    (tier) => tier.engagement === "self_serve" && !tier.flagship,
  );
}

export function getSalesPricingTiers(): PricingTier[] {
  return PRICING_TIERS.filter(
    (tier) => tier.engagement === "sales" && !tier.flagship,
  );
}

export function getFlagshipPricingTier(): PricingTier | undefined {
  return PRICING_TIERS.find((tier) => tier.flagship);
}

export function getTierDisplayPrice(
  tier: Pick<
    PricingTier,
    "priceLabel" | "priceNote" | "priceLabelAnnual" | "priceNoteAnnual"
  >,
  interval: BillingInterval,
): { priceLabel: string; priceNote: string } {
  if (interval === "year" && tier.priceLabelAnnual) {
    return {
      priceLabel: tier.priceLabelAnnual,
      priceNote: tier.priceNoteAnnual ?? "per year",
    };
  }

  return {
    priceLabel: tier.priceLabel,
    priceNote: tier.priceNote,
  };
}

const PLAN_TO_TIER: Record<BillingPlanId, PricingTierId> = {
  free: "free",
  starter: "starter",
  studio: "studio",
  operator: "operator",
  scale: "scale",
  enterprise: "department",
  government: "holding",
};

export function resolvePricingTierIdForPlan(
  planId: BillingPlanId,
): PricingTierId {
  return PLAN_TO_TIER[planId] ?? "free";
}

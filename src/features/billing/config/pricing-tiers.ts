import type { BillingInterval, BillingPlanId } from "./plans";

export type PricingTierId =
  | "free"
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
 * Marketing catalog — USD list prices (Polar presentment).
 * Self-serve CTA copy: "Launch a digital employee" (not "Choose a plan").
 * DB plan id `operator` is displayed as Team.
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Evaluation",
    priceLabel: "$0",
    priceNote: "No credit card",
    description:
      "Evaluate a digital employee with curated NULLXES presets and hard Talk limits.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "1 digital employee (presets)",
      "2-minute Talk sessions · 30 min / month",
      "Evaluation watermark",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    priceLabel: "$49",
    priceNote: "per month",
    priceLabelAnnual: "$470",
    priceNoteAnnual: "per year · save 20%",
    description: "Launch one digital employee for founders and innovation labs.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "1 digital employee",
      "10-minute Talk · 180 min / month",
      "1 custom avatar",
    ],
  },
  {
    id: "operator",
    name: "Team",
    priceLabel: "$200",
    priceNote: "per month",
    priceLabelAnnual: "$1,920",
    priceNoteAnnual: "per year · save 20%",
    description: "A small digital workforce for teams running real workloads.",
    engagement: "self_serve",
    flagship: false,
    recommended: true,
    features: [
      "3 digital employees",
      "20-minute Talk · 600 min / month",
      "API read access",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    priceLabel: "$600",
    priceNote: "per month",
    priceLabelAnnual: "$5,760",
    priceNoteAnnual: "per year · save 20%",
    description: "Grow a digital team before enterprise Design Partner deployment.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "10 digital employees",
      "30-minute Talk · 2 000 min / month",
      "Full API access",
    ],
  },
  {
    id: "discovery",
    name: "Discovery",
    priceLabel: "Contact sales",
    priceNote: "Fixed-scope engagement",
    description: "Map processes and prove value before scaling the workforce.",
    engagement: "sales",
    flagship: false,
    features: [
      "Process & automation mapping",
      "1–2 production prototypes",
      "Deployment readiness assessment",
      "Dedicated solutions architect",
    ],
  },
  {
    id: "pilot",
    name: "Pilot",
    priceLabel: "Contact sales",
    priceNote: "Per pilot program",
    description: "Stand up the first live digital employees in production.",
    engagement: "sales",
    flagship: false,
    features: [
      "3–10 digital employees in production",
      "Custom avatars & voices",
      "Systems & knowledge integration",
      "Success metrics & reporting",
    ],
  },
  {
    id: "department",
    name: "Digital Department Deployment",
    priceLabel: "Contact sales",
    priceNote: "Annual program",
    description:
      "Operate a full digital department as a managed workforce layer — not a single-team chatbot.",
    engagement: "sales",
    flagship: false,
    features: [
      "Full department automation",
      "Governance & role controls",
      "Advanced analytics & audit",
      "SSO & priority support",
    ],
  },
  {
    id: "holding",
    name: "Holding",
    priceLabel: "Contact sales",
    priceNote: "Annual platform license",
    description: "Coordinate digital workforces across many organizations.",
    engagement: "sales",
    flagship: false,
    features: [
      "Multi-organization workforce",
      "Hundreds of digital employees",
      "Compliance & data residency",
      "SLA & dedicated engineering",
    ],
  },
  {
    id: "flagship",
    name: "Flagship",
    priceLabel: "Strategic",
    priceNote: "Partnership · contact founders",
    description:
      "A sovereign digital corporation built and operated with NULLXES — pricing by negotiation.",
    engagement: "sales",
    flagship: true,
    features: [
      "Sovereign digital corporation",
      "Private infrastructure & models",
      "Custom AI & avatar engine",
      "Embedded NULLXES team",
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

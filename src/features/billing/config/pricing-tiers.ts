import type { BillingPlanId } from "./plans";

export type PricingTierId =
  | "free"
  | "super_pro"
  | "discovery"
  | "pilot"
  | "department"
  | "holding"
  | "ultra";

export type PricingTierEngagement = "self_serve" | "sales";

export type PricingTier = {
  id: PricingTierId;
  name: string;
  priceLabel: string;
  priceNote: string;
  description: string;
  engagement: PricingTierEngagement;
  flagship: boolean;
  features: string[];
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    priceNote: "No credit card",
    description: "Evaluate a single digital employee with curated presets.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "1 digital employee",
      "Curated avatar presets",
      "2-minute Talk sessions",
    ],
  },
  {
    id: "super_pro",
    name: "Super Pro",
    priceLabel: "$950",
    priceNote: "per month",
    description: "Self-serve workspace for small teams running real workloads.",
    engagement: "self_serve",
    flagship: false,
    features: [
      "Unlimited digital employees",
      "Custom avatar upload & generation",
      "Full analytics & audit trail",
      "Team access & API",
    ],
  },
  {
    id: "discovery",
    name: "Discovery",
    priceLabel: "$20K–50K",
    priceNote: "Fixed-scope engagement",
    description: "Map your processes and prove value before scaling.",
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
    priceLabel: "$80K–250K",
    priceNote: "Per pilot program",
    description: "Stand up your first live department in production.",
    engagement: "sales",
    flagship: false,
    features: [
      "First live department (3–10 employees)",
      "Custom avatars & voices",
      "Systems & knowledge integration",
      "Success metrics & reporting",
    ],
  },
  {
    id: "department",
    name: "Department",
    priceLabel: "$500K–2M",
    priceNote: "Annual program",
    description: "Operate a full department as a managed digital workforce.",
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
    priceLabel: "$5M–20M",
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
    id: "ultra",
    name: "Ultra",
    priceLabel: "$500M",
    priceNote: "Strategic partnership",
    description:
      "A sovereign digital corporation built and operated with NULLXES.",
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

export function getFlagshipPricingTier(): PricingTier | undefined {
  return PRICING_TIERS.find((tier) => tier.flagship);
}

const PLAN_TO_TIER: Record<BillingPlanId, PricingTierId> = {
  free: "free",
  super_pro: "super_pro",
  enterprise: "department",
  government: "holding",
};

export function resolvePricingTierIdForPlan(
  planId: BillingPlanId,
): PricingTierId {
  return PLAN_TO_TIER[planId] ?? "free";
}

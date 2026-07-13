export type BillingPlanId =
  | "free"
  | "studio"
  | "operator"
  | "scale"
  | "enterprise"
  | "government";

export type ApiAccessLevel = "none" | "read" | "full";

export type BillingInterval = "month" | "year";

export type BillingPlanDefinition = {
  id: BillingPlanId;
  name: string;
  priceLabel: string;
  /** Annual list price when self-serve annual product exists (−20%). */
  priceLabelAnnual?: string;
  description: string;
  checkoutEnabled: boolean;
  limits: {
    maxEmployees: number | null;
    maxOrganizations: number | null;
    maxSessionSeconds: number | null;
    /** Monthly Talk minutes budget. null = unlimited (enterprise). */
    maxTalkMinutesPerMonth: number | null;
    maxKnowledgeChunks: number | null;
    allowCustomAvatars: boolean;
    maxCustomAvatars: number | null;
    maxSeats: number | null;
    apiAccess: ApiAccessLevel;
    /** Free beta: curated catalog only — no self-serve create. */
    canCreateEmployees: boolean;
  };
  features: string[];
};

export const BILLING_PLANS: Record<BillingPlanId, BillingPlanDefinition> = {
  free: {
    id: "free",
    name: "Evaluation",
    priceLabel: "$0",
    description: "Evaluate a digital employee with curated NULLXES presets.",
    checkoutEnabled: false,
    limits: {
      maxEmployees: 1,
      maxOrganizations: 1,
      maxSessionSeconds: 120,
      maxTalkMinutesPerMonth: 30,
      maxKnowledgeChunks: 5_000,
      allowCustomAvatars: false,
      maxCustomAvatars: 0,
      maxSeats: 1,
      apiAccess: "none",
      canCreateEmployees: false,
    },
    features: [
      "NULLXES beta digital employees (read-only)",
      "2-minute Talk sessions",
      "30 Talk minutes / month",
      "Upgrade to create your own workforce",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    priceLabel: "$49 / mo",
    priceLabelAnnual: "$470 / yr",
    description: "Launch one digital employee for founders and innovation labs.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 1,
      maxOrganizations: 1,
      maxSessionSeconds: 600,
      maxTalkMinutesPerMonth: 180,
      maxKnowledgeChunks: 15_000,
      allowCustomAvatars: true,
      maxCustomAvatars: 1,
      maxSeats: 1,
      apiAccess: "none",
      canCreateEmployees: true,
    },
    features: [
      "1 digital employee",
      "10-minute Talk sessions",
      "180 Talk minutes / month",
      "1 custom avatar",
    ],
  },
  operator: {
    id: "operator",
    name: "Team",
    priceLabel: "$200 / mo",
    priceLabelAnnual: "$1,920 / yr",
    description: "Small digital workforce for teams running real workloads.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 3,
      maxOrganizations: 1,
      maxSessionSeconds: 1_200,
      maxTalkMinutesPerMonth: 600,
      maxKnowledgeChunks: 50_000,
      allowCustomAvatars: true,
      maxCustomAvatars: 3,
      maxSeats: 3,
      apiAccess: "read",
      canCreateEmployees: true,
    },
    features: [
      "3 digital employees",
      "20-minute Talk sessions",
      "600 Talk minutes / month",
      "3 custom avatars",
      "API read access",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceLabel: "$600 / mo",
    priceLabelAnnual: "$5,760 / yr",
    description: "Grow a digital team before enterprise deployment.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 10,
      maxOrganizations: 1,
      maxSessionSeconds: 1_800,
      maxTalkMinutesPerMonth: 2_000,
      maxKnowledgeChunks: 150_000,
      allowCustomAvatars: true,
      maxCustomAvatars: 10,
      maxSeats: 10,
      apiAccess: "full",
      canCreateEmployees: true,
    },
    features: [
      "10 digital employees",
      "30-minute Talk sessions",
      "2 000 Talk minutes / month",
      "10 custom avatars",
      "Full API access",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Contact sales",
    description: "Digital Department Deployment — custom security and SLA.",
    checkoutEnabled: false,
    limits: {
      maxEmployees: null,
      maxOrganizations: null,
      maxSessionSeconds: null,
      maxTalkMinutesPerMonth: null,
      maxKnowledgeChunks: 100_000,
      allowCustomAvatars: true,
      maxCustomAvatars: null,
      maxSeats: null,
      apiAccess: "full",
      canCreateEmployees: true,
    },
    features: [
      "Digital Department Deployment",
      "Unlimited custom avatars",
      "Governance, SSO, and SLA",
      "Dedicated support",
    ],
  },
  government: {
    id: "government",
    name: "Holding",
    priceLabel: "Contact sales",
    description: "Coordinate digital workforces across many organizations.",
    checkoutEnabled: false,
    limits: {
      maxEmployees: null,
      maxOrganizations: null,
      maxSessionSeconds: null,
      maxTalkMinutesPerMonth: null,
      maxKnowledgeChunks: null,
      allowCustomAvatars: true,
      maxCustomAvatars: null,
      maxSeats: null,
      apiAccess: "full",
      canCreateEmployees: true,
    },
    features: [
      "Multi-organization workforce",
      "Hundreds of digital employees",
      "Compliance & data residency",
      "SLA & dedicated engineering",
    ],
  },
};

/** Self-serve paid plans eligible for Polar checkout when products exist. */
export const SELF_SERVE_CHECKOUT_PLAN_IDS: BillingPlanId[] = [
  "studio",
  "operator",
  "scale",
];

/** USD cents for Polar fixed prices (monthly / annual −20%). */
export const SELF_SERVE_PRICE_CENTS: Record<
  "studio" | "operator" | "scale",
  Record<BillingInterval, number>
> = {
  studio: { month: 4_900, year: 47_000 },
  operator: { month: 20_000, year: 192_000 },
  scale: { month: 60_000, year: 576_000 },
};

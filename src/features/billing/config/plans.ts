export type BillingPlanId =
  | "free"
  | "starter"
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
    name: "Free",
    priceLabel: "0 ₽",
    description: "Try a digital employee on NULLXES presets.",
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
      "1 digital employee (presets)",
      "30 Talk minutes / month",
      "Web chat",
      "No API",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceLabel: "599 ₽ / mo",
    priceLabelAnnual: "5 759 ₽ / yr",
    description: "Your first digital employee for everyday work.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 1,
      maxOrganizations: 1,
      maxSessionSeconds: 600,
      maxTalkMinutesPerMonth: 60,
      maxKnowledgeChunks: 2_500,
      allowCustomAvatars: true,
      maxCustomAvatars: 1,
      maxSeats: 1,
      apiAccess: "none",
      canCreateEmployees: true,
    },
    features: [
      "1 digital employee",
      "Up to 60 Talk minutes / month",
      "Up to 10 knowledge sources",
      "1 personal avatar",
      "Dialog history",
      "Web interface",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    priceLabel: "4 999 ₽ / mo",
    priceLabelAnnual: "47 999 ₽ / yr",
    description: "For specialists, founders, and individual work.",
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
      "Up to 180 Talk minutes / month",
      "Expanded knowledge base",
      "Unrestricted personal avatar",
      "History and dialog search",
      "Priority request handling",
    ],
  },
  operator: {
    id: "operator",
    name: "Team",
    priceLabel: "19 999 ₽ / mo",
    priceLabelAnnual: "191 999 ₽ / yr",
    description: "A digital team for collaboration and first integrations.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 3,
      maxOrganizations: 1,
      maxSessionSeconds: 1_200,
      maxTalkMinutesPerMonth: 600,
      maxKnowledgeChunks: 50_000,
      allowCustomAvatars: true,
      maxCustomAvatars: 3,
      maxSeats: 5,
      apiAccess: "read",
      canCreateEmployees: true,
    },
    features: [
      "Up to 3 digital employees",
      "Up to 600 Talk minutes / month",
      "Shared workspace",
      "Shared knowledge base",
      "Read API",
      "Member management",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceLabel: "59 999 ₽ / mo",
    priceLabelAnnual: "575 999 ₽ / yr",
    description:
      "For companies growing a digital team before enterprise deployment.",
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
      "Up to 10 digital employees",
      "Up to 2 000 Talk minutes / month",
      "Full API",
      "Multiple avatars and roles",
      "Expanded knowledge base",
      "Priority support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Contact sales",
    description: "Digital department under unified management.",
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
      "Department automation",
      "Role and access control",
      "Analytics and activity log",
      "SSO and priority support",
    ],
  },
  government: {
    id: "government",
    name: "Holding",
    priceLabel: "Contact sales",
    description: "Manage digital employees across organizations.",
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
      "Multiple organizations",
      "Hundreds of digital employees",
      "Data security requirements",
      "Dedicated engineering and SLA",
    ],
  },
};

/** Self-serve paid plans eligible for Polar/T-Bank checkout when products exist. */
export const SELF_SERVE_CHECKOUT_PLAN_IDS: BillingPlanId[] = [
  "starter",
  "studio",
  "operator",
  "scale",
];

/** USD cents for Polar fixed prices (monthly / annual −20%). Legacy USD path. */
export const SELF_SERVE_PRICE_CENTS: Record<
  "starter" | "studio" | "operator" | "scale",
  Record<BillingInterval, number>
> = {
  starter: { month: 700, year: 6_700 },
  studio: { month: 6_200, year: 59_500 },
  operator: { month: 25_000, year: 240_000 },
  scale: { month: 75_000, year: 720_000 },
};

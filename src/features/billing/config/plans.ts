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
    /**
     * Custom (org-owned) employees only. Platform catalog never counts.
     * Free: catalog Talk only — no self-serve create.
     */
    canCreateEmployees: boolean;
  };
  features: string[];
};

export const BILLING_PLANS: Record<BillingPlanId, BillingPlanDefinition> = {
  free: {
    id: "free",
    name: "Evaluation",
    priceLabel: "0 ₽",
    description: "Meet NULLXES employees. Build your own on paid plans.",
    checkoutEnabled: false,
    limits: {
      maxEmployees: 0,
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
      "2 demo employees: Adeline + Yuki",
      "30 Talk minutes / month",
      "AI chat",
      "No custom employees",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceLabel: "599 ₽ / mo",
    priceLabelAnnual: "5 759 ₽ / yr",
    description: "Starter catalog plus your first custom digital employees.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 2,
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
      "Starter catalog: Adeline + Yuki",
      "2 custom digital employees",
      "Up to 60 Talk minutes / month",
      "Up to 2,500 knowledge chunks",
      "1 custom avatar included",
      "Dialog history",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    priceLabel: "4 999 ₽ / mo",
    priceLabelAnnual: "47 999 ₽ / yr",
    description: "Starter catalog access with room for a personal digital team.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 5,
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
      "Starter catalog: Adeline + Yuki",
      "5 custom digital employees",
      "Up to 180 Talk minutes / month",
      "Up to 15,000 knowledge chunks",
      "1 custom avatar included",
      "History and dialog search",
    ],
  },
  operator: {
    id: "operator",
    name: "Team",
    priceLabel: "19 999 ₽ / mo",
    priceLabelAnnual: "191 999 ₽ / yr",
    description: "A digital team with extended catalog and first integrations.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 10,
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
      "Full NULLXES employee marketplace access",
      "10 custom digital employees",
      "Up to 600 Talk minutes / month",
      "Shared workspace",
      "Up to 50,000 knowledge chunks",
      "Read API",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceLabel: "59 999 ₽ / mo",
    priceLabelAnnual: "575 999 ₽ / yr",
    description:
      "Full catalog access for companies growing a digital workforce.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 20,
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
      "Full NULLXES catalog",
      "20 custom digital employees",
      "Up to 2,000 Talk minutes / month",
      "Full API",
      "Up to 10 custom avatars",
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

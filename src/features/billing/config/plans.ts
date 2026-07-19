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
    description: "Talk to demo employees. Hire your own on a paid plan.",
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
    priceLabel: "4 990 ₽ / mo",
    priceLabelAnnual: "47 904 ₽ / yr",
    description: "Your first custom digital employees. Not a toy chat seat.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 3,
      maxOrganizations: 1,
      maxSessionSeconds: 900,
      maxTalkMinutesPerMonth: 120,
      maxKnowledgeChunks: 5_000,
      allowCustomAvatars: true,
      maxCustomAvatars: 1,
      maxSeats: 1,
      apiAccess: "none",
      canCreateEmployees: true,
    },
    features: [
      "Starter catalog: Adeline + Yuki",
      "3 custom digital employees",
      "Up to 120 Talk minutes / month",
      "Up to 5,000 knowledge chunks",
      "1 custom avatar included",
      "Dialog history",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    priceLabel: "14 990 ₽ / mo",
    priceLabelAnnual: "143 904 ₽ / yr",
    description: "A personal digital team you actually run day to day.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 8,
      maxOrganizations: 1,
      maxSessionSeconds: 900,
      maxTalkMinutesPerMonth: 400,
      maxKnowledgeChunks: 25_000,
      allowCustomAvatars: true,
      maxCustomAvatars: 2,
      maxSeats: 2,
      apiAccess: "none",
      canCreateEmployees: true,
    },
    features: [
      "Starter catalog: Adeline + Yuki",
      "8 custom digital employees",
      "Up to 400 Talk minutes / month",
      "Up to 25,000 knowledge chunks",
      "2 custom avatars included",
      "History and dialog search",
    ],
  },
  operator: {
    id: "operator",
    name: "Team",
    priceLabel: "49 990 ₽ / mo",
    priceLabelAnnual: "479 904 ₽ / yr",
    description: "A department of digital employees with seats and read API.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 20,
      maxOrganizations: 1,
      maxSessionSeconds: 1_800,
      maxTalkMinutesPerMonth: 1_500,
      maxKnowledgeChunks: 100_000,
      allowCustomAvatars: true,
      maxCustomAvatars: 5,
      maxSeats: 10,
      apiAccess: "read",
      canCreateEmployees: true,
    },
    features: [
      "Full NULLXES employee marketplace access",
      "20 custom digital employees",
      "Up to 1,500 Talk minutes / month",
      "Shared workspace · 10 seats",
      "Up to 100,000 knowledge chunks",
      "Read API",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceLabel: "149 990 ₽ / mo",
    priceLabelAnnual: "1 439 904 ₽ / yr",
    description: "Grow a real digital workforce with full API access.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: 50,
      maxOrganizations: 1,
      maxSessionSeconds: 3_600,
      maxTalkMinutesPerMonth: 5_000,
      maxKnowledgeChunks: 300_000,
      allowCustomAvatars: true,
      maxCustomAvatars: 20,
      maxSeats: 25,
      apiAccess: "full",
      canCreateEmployees: true,
    },
    features: [
      "Full NULLXES catalog",
      "50 custom digital employees",
      "Up to 5,000 Talk minutes / month",
      "Full API",
      "Up to 20 custom avatars",
      "Priority support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Contact sales",
    description:
      "Digital department under unified management. Custom terms and SLA.",
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
    description:
      "Operate digital employees across organizations with dedicated support.",
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

/** USD cents for Polar fixed prices (monthly / annual −20%). Presentment + Polar sync. */
export const SELF_SERVE_PRICE_CENTS: Record<
  "starter" | "studio" | "operator" | "scale",
  Record<BillingInterval, number>
> = {
  starter: { month: 4_900, year: 47_000 },
  studio: { month: 14_900, year: 143_000 },
  operator: { month: 49_900, year: 479_000 },
  scale: { month: 149_900, year: 1_439_000 },
};

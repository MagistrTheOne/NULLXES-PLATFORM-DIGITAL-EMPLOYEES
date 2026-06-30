export type BillingPlanId = "free" | "super_pro" | "enterprise" | "government";

export type BillingPlanDefinition = {
  id: BillingPlanId;
  name: string;
  priceLabel: string;
  description: string;
  checkoutEnabled: boolean;
  limits: {
    maxEmployees: number | null;
    maxOrganizations: number | null;
    maxSessionSeconds: number | null;
    maxKnowledgeChunks: number | null;
    allowCustomAvatars: boolean;
  };
  features: string[];
};

export const BILLING_PLANS: Record<BillingPlanId, BillingPlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    description: "Evaluate your first digital employee.",
    checkoutEnabled: false,
    limits: {
      maxEmployees: 1,
      maxOrganizations: 1,
      maxSessionSeconds: 120,
      maxKnowledgeChunks: 5_000,
      allowCustomAvatars: false,
    },
    features: [
      "1 digital employee",
      "1 organization",
      "2 minutes per Talk session",
      "Curated NULLXES employee presets (Somnia, Kaira, Megan, Lili)",
    ],
  },
  super_pro: {
    id: "super_pro",
    name: "Super Pro",
    priceLabel: "$950 / mo",
    description: "Premium workspace for serious digital workforce operations.",
    checkoutEnabled: true,
    limits: {
      maxEmployees: null,
      maxOrganizations: 1,
      maxSessionSeconds: null,
      maxKnowledgeChunks: 32_000,
      allowCustomAvatars: true,
    },
    features: [
      "Unlimited digital employees",
      "Custom avatar upload and generation",
      "Full analytics and audit trail",
      "Priority knowledge indexing",
      "Team invites and API access",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Contact sales",
    description: "Custom deployment, security, and SLA.",
    checkoutEnabled: false,
    limits: {
      maxEmployees: null,
      maxOrganizations: null,
      maxSessionSeconds: null,
      maxKnowledgeChunks: 100_000,
      allowCustomAvatars: true,
    },
    features: [
      "Unlimited custom avatars",
      "Dedicated support",
      "Custom retention and compliance",
      "SSO and advanced security",
    ],
  },
  government: {
    id: "government",
    name: "Government",
    priceLabel: "Contact sales",
    description: "Sovereign and regulated environments.",
    checkoutEnabled: false,
    limits: {
      maxEmployees: null,
      maxOrganizations: null,
      maxSessionSeconds: null,
      maxKnowledgeChunks: null,
      allowCustomAvatars: true,
    },
    features: [
      "Unlimited custom avatars",
      "Air-gapped options",
      "FedRAMP-aligned controls",
      "Dedicated account team",
    ],
  },
};


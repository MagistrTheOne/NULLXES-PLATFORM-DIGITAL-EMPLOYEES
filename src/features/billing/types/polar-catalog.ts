import type { BillingPlanId } from "../config/plans";

export type PolarCatalogProduct = {
  productId: string;
  planId: BillingPlanId | null;
  name: string;
  description: string | null;
  priceLabel: string;
  priceNote: string;
  isRecurring: boolean;
  checkoutEnabled: boolean;
};

export type PolarSubscriptionSnapshot = {
  subscriptionId: string;
  productId: string;
  planId: BillingPlanId;
  status: string;
  priceLabel: string;
  priceNote: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
};

export type BillingPlanSource = "polar" | "manual" | "free";

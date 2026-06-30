import type { BillingPlanId } from "../config/plans";
import type { PricingTierId } from "../config/pricing-tiers";

export type PolarCatalogProduct = {
  productId: string;
  planId: BillingPlanId | null;
  tierId: PricingTierId | null;
  name: string;
  description: string | null;
  priceLabel: string;
  priceNote: string;
  isRecurring: boolean;
  checkoutEnabled: boolean;
  /** True when Polar price is non-zero (self-serve checkout candidate). */
  hasLivePrice: boolean;
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

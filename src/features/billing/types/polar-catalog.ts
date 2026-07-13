import type { BillingInterval, BillingPlanId } from "../config/plans";
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
  recurringInterval: BillingInterval | null;
  checkoutEnabled: boolean;
  /** True when Polar price is non-zero (self-serve checkout candidate). */
  hasLivePrice: boolean;
  /** One-time payment verification plate ($1), does not upgrade plan. */
  isVerification: boolean;
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

/** Checkout URLs keyed by billing interval for a self-serve plan. */
export type SelfServeCheckoutUrls = Partial<
  Record<
    "starter" | "studio" | "operator" | "scale",
    Partial<Record<BillingInterval, string>>
  >
>;

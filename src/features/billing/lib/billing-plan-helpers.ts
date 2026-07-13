import {
  BILLING_PLANS,
  type BillingInterval,
  type BillingPlanId,
} from "../config/plans";
import {
  getTierDisplayPrice,
  type PricingTierId,
} from "../config/pricing-tiers";
import type {
  PolarCatalogProduct,
  PolarSubscriptionSnapshot,
} from "../types/polar-catalog";

const SELF_SERVE_TIER_TO_PLAN: Partial<Record<PricingTierId, BillingPlanId>> = {
  starter: "starter",
  studio: "studio",
  operator: "operator",
  scale: "scale",
};

function findPolarCatalogProductForTier(
  catalog: PolarCatalogProduct[],
  tierId: PricingTierId,
  interval: BillingInterval,
): PolarCatalogProduct | undefined {
  const planId = SELF_SERVE_TIER_TO_PLAN[tierId];
  const matches = catalog.filter(
    (product) =>
      product.tierId === tierId ||
      (planId != null && product.planId === planId) ||
      (tierId === "scale" && product.planId === "scale"),
  );

  return (
    matches.find((product) => product.recurringInterval === interval) ??
    matches.find((product) => product.recurringInterval == null) ??
    matches[0]
  );
}

export const MANUAL_BILLING_PLANS: BillingPlanId[] = ["enterprise", "government"];

export function isManualBillingPlan(planId: BillingPlanId): boolean {
  return MANUAL_BILLING_PLANS.includes(planId);
}

export function getBillingPlanDisplay(input: {
  planId: BillingPlanId;
  polarProductName?: string | null;
  polarPriceLabel?: string | null;
}): {
  name: string;
  priceLabel: string;
  description: string;
} {
  const plan = BILLING_PLANS[input.planId];

  return {
    name: input.polarProductName ?? plan.name,
    priceLabel: input.polarPriceLabel ?? plan.priceLabel,
    description: plan.description,
  };
}

export function resolveEffectiveBillingPlanId(input: {
  dbPlanId: BillingPlanId;
  subscription: PolarSubscriptionSnapshot | null;
}): BillingPlanId {
  return input.subscription?.planId ?? input.dbPlanId;
}

export function getPolarCatalogPriceForTier(
  catalog: PolarCatalogProduct[],
  tierId: PricingTierId,
  interval: BillingInterval = "month",
): Pick<PolarCatalogProduct, "priceLabel" | "priceNote"> | null {
  const product = findPolarCatalogProductForTier(catalog, tierId, interval);
  if (!product) {
    return null;
  }

  return {
    priceLabel: product.priceLabel,
    priceNote: product.priceNote,
  };
}

export function resolveTierPriceDisplay(input: {
  catalog: PolarCatalogProduct[];
  tierId: PricingTierId;
  interval: BillingInterval;
  fallbackTier: {
    priceLabel: string;
    priceNote: string;
    priceLabelAnnual?: string;
    priceNoteAnnual?: string;
  };
}): { priceLabel: string; priceNote: string } {
  const live = getPolarCatalogPriceForTier(
    input.catalog,
    input.tierId,
    input.interval,
  );
  if (live) {
    return live;
  }

  return getTierDisplayPrice(input.fallbackTier, input.interval);
}

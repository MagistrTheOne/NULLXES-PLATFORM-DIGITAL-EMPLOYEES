import { BILLING_PLANS, type BillingPlanId } from "../config/plans";
import type { PricingTierId } from "../config/pricing-tiers";
import type {
  PolarCatalogProduct,
  PolarSubscriptionSnapshot,
} from "../types/polar-catalog";

const SELF_SERVE_TIER_TO_PLAN: Partial<Record<PricingTierId, BillingPlanId>> = {
  studio: "studio",
  operator: "operator",
  scale: "scale",
};

function findPolarCatalogProductForTier(
  catalog: PolarCatalogProduct[],
  tierId: PricingTierId,
): PolarCatalogProduct | undefined {
  const planId = SELF_SERVE_TIER_TO_PLAN[tierId];
  return (
    catalog.find((product) => product.tierId === tierId) ??
    (planId
      ? catalog.find((product) => product.planId === planId)
      : undefined) ??
    (tierId === "scale"
      ? catalog.find((product) => product.planId === "scale")
      : undefined)
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
): Pick<PolarCatalogProduct, "priceLabel" | "priceNote"> | null {
  const product = findPolarCatalogProductForTier(catalog, tierId);
  if (!product) {
    return null;
  }

  return {
    priceLabel: product.priceLabel,
    priceNote: product.priceNote,
  };
}

import { BILLING_PLANS, type BillingPlanId } from "../config/plans";
import type { PricingTierId } from "../config/pricing-tiers";
import type {
  PolarCatalogProduct,
  PolarSubscriptionSnapshot,
} from "../types/polar-catalog";

function findPolarCatalogProductForTier(
  catalog: PolarCatalogProduct[],
  tierId: PricingTierId,
): PolarCatalogProduct | undefined {
  return (
    catalog.find((product) => product.tierId === tierId) ??
    (tierId === "super_pro"
      ? catalog.find((product) => product.planId === "super_pro")
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

import { BILLING_PLANS, type BillingPlanId } from "../config/plans";
import type {
  PolarCatalogProduct,
  PolarSubscriptionSnapshot,
} from "../types/polar-catalog";

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
  tierId: "free" | "super_pro",
): Pick<PolarCatalogProduct, "priceLabel" | "priceNote"> | null {
  if (tierId !== "super_pro") {
    return null;
  }

  const product = catalog.find((item) => item.planId === "super_pro");
  if (!product) {
    return null;
  }

  return {
    priceLabel: product.priceLabel,
    priceNote: product.priceNote,
  };
}

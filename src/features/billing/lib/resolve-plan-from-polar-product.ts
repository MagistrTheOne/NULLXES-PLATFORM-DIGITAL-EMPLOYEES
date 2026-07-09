import {
  BILLING_PLANS,
  SELF_SERVE_CHECKOUT_PLAN_IDS,
  type BillingPlanId,
} from "../config/plans";

export function resolveBillingPlanFromPolarProduct(
  productId: string | null | undefined,
  productPlanMap?: Map<string, BillingPlanId>,
): BillingPlanId {
  if (!productId) {
    return "free";
  }

  const mappedPlan = productPlanMap?.get(productId);
  if (mappedPlan) {
    return mappedPlan;
  }

  const normalized = productId.toLowerCase();
  if (normalized.includes("enterprise")) {
    return "enterprise";
  }
  if (normalized.includes("government") || normalized.includes("gov")) {
    return "government";
  }
  if (normalized.includes("studio")) {
    return "studio";
  }
  if (normalized.includes("operator")) {
    return "operator";
  }
  if (
    normalized.includes("scale") ||
    normalized.includes("super_pro") ||
    normalized.includes("super-pro") ||
    normalized.includes("super pro")
  ) {
    return "scale";
  }

  return "scale";
}

export function isPaidBillingPlan(planId: BillingPlanId): boolean {
  return BILLING_PLANS[planId].checkoutEnabled || planId !== "free";
}

export function isSelfServeCheckoutPlan(planId: BillingPlanId): boolean {
  return SELF_SERVE_CHECKOUT_PLAN_IDS.includes(planId);
}

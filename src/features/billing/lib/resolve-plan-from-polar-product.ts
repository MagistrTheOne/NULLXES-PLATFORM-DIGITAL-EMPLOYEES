import {
  BILLING_PLANS,
  getPolarProductId,
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

  const envMappings: Array<[BillingPlanId, string | undefined]> = [
    ["super_pro", getPolarProductId("super_pro")],
    ["enterprise", getPolarProductId("enterprise")],
    ["government", getPolarProductId("government")],
    ["free", getPolarProductId("free")],
  ];

  for (const [planId, envProductId] of envMappings) {
    if (envProductId && envProductId === productId) {
      return planId;
    }
  }

  const normalized = productId.toLowerCase();
  if (normalized.includes("enterprise")) {
    return "enterprise";
  }
  if (normalized.includes("government") || normalized.includes("gov")) {
    return "government";
  }

  return "super_pro";
}

export function isPaidBillingPlan(planId: BillingPlanId): boolean {
  return BILLING_PLANS[planId].checkoutEnabled || planId !== "free";
}

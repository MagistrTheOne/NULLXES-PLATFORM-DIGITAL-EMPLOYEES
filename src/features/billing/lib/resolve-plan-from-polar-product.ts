import {
  BILLING_PLANS,
  getPolarProductId,
  type BillingPlanId,
} from "../config/plans";

export function resolveBillingPlanFromPolarProduct(
  productId: string | null | undefined,
): BillingPlanId {
  if (!productId) {
    return "super_pro";
  }

  const mappings: Array<[BillingPlanId, string | undefined]> = [
    ["super_pro", getPolarProductId("super_pro")],
    ["enterprise", getPolarProductId("enterprise")],
    ["government", getPolarProductId("government")],
    ["free", getPolarProductId("free")],
  ];

  for (const [planId, envProductId] of mappings) {
    if (envProductId && envProductId === productId) {
      return planId;
    }
  }

  const productName = productId.toLowerCase();
  if (productName.includes("enterprise")) {
    return "enterprise";
  }
  if (productName.includes("government") || productName.includes("gov")) {
    return "government";
  }

  return "super_pro";
}

export function isPaidBillingPlan(planId: BillingPlanId): boolean {
  return BILLING_PLANS[planId].checkoutEnabled || planId !== "free";
}

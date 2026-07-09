import type { BillingPlanId } from "../config/plans";

/** Legacy Polar / DB value mapped to Scale. */
const LEGACY_PLAN_ALIASES: Record<string, BillingPlanId> = {
  super_pro: "scale",
};

export function resolveBillingPlanId(billingPlan: string): BillingPlanId {
  const aliased = LEGACY_PLAN_ALIASES[billingPlan];
  if (aliased) {
    return aliased;
  }

  if (
    billingPlan === "free" ||
    billingPlan === "studio" ||
    billingPlan === "operator" ||
    billingPlan === "scale" ||
    billingPlan === "enterprise" ||
    billingPlan === "government"
  ) {
    return billingPlan;
  }

  return "free";
}

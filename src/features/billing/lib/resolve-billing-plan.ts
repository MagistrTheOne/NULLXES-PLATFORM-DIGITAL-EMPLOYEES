import type { BillingPlanId } from "../config/plans";

export function resolveBillingPlanId(billingPlan: string): BillingPlanId {
  if (
    billingPlan === "free" ||
    billingPlan === "super_pro" ||
    billingPlan === "enterprise" ||
    billingPlan === "government"
  ) {
    return billingPlan;
  }

  return "free";
}

import {
  BILLING_PLANS,
  type BillingPlanId,
} from "@/features/billing/config/plans";

export function planAllowsCustomAvatars(planId: BillingPlanId): boolean {
  return BILLING_PLANS[planId].limits.allowCustomAvatars;
}

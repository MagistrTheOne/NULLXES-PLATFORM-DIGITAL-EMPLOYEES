import {
  BILLING_PLANS,
  type ApiAccessLevel,
  type BillingPlanId,
} from "@/features/billing/config/plans";

export function planAllowsCustomAvatars(planId: BillingPlanId): boolean {
  return BILLING_PLANS[planId].limits.allowCustomAvatars;
}

export function planMaxCustomAvatars(planId: BillingPlanId): number | null {
  return BILLING_PLANS[planId].limits.maxCustomAvatars;
}

export function planMaxSeats(planId: BillingPlanId): number | null {
  return BILLING_PLANS[planId].limits.maxSeats;
}

export function planMaxTalkMinutesPerMonth(
  planId: BillingPlanId,
): number | null {
  return BILLING_PLANS[planId].limits.maxTalkMinutesPerMonth;
}

export function planApiAccessLevel(planId: BillingPlanId): ApiAccessLevel {
  return BILLING_PLANS[planId].limits.apiAccess;
}

export function planAllowsApiAccess(
  planId: BillingPlanId,
  required: ApiAccessLevel = "read",
): boolean {
  const access = planApiAccessLevel(planId);
  if (required === "none") return true;
  if (required === "read") return access === "read" || access === "full";
  return access === "full";
}

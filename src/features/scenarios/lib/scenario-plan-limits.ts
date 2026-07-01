import type { BillingPlanId } from "@/features/billing/config/plans";

export const FREE_SCENARIO_MONTHLY_LIMIT = 3;

export function getScenarioMonthlyLimitForPlan(
  billingPlan: BillingPlanId,
): number | null {
  if (billingPlan === "free") {
    return FREE_SCENARIO_MONTHLY_LIMIT;
  }
  return null;
}

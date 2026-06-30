import type { BillingPlanId } from "../config/plans";
import { BILLING_PLANS } from "../config/plans";

export function getKnowledgeChunkLimitForPlan(
  planId: BillingPlanId,
): number | null {
  return BILLING_PLANS[planId].limits.maxKnowledgeChunks;
}

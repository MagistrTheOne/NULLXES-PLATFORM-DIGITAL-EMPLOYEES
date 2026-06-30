import type { BillingPlanId } from "../config/plans";
import type { PricingTierId } from "../config/pricing-tiers";

export const POLAR_PRODUCT_NAMESPACE = "nullxes_digital_employees";

export const BILLING_PLAN_IDS: BillingPlanId[] = [
  "free",
  "super_pro",
  "enterprise",
  "government",
];

export const PRICING_TIER_IDS: PricingTierId[] = [
  "free",
  "super_pro",
  "discovery",
  "pilot",
  "department",
  "holding",
  "ultra",
];

export function readMetadataPlan(
  metadata: Record<string, unknown>,
): BillingPlanId | null {
  const raw = metadata.plan;
  if (typeof raw !== "string") {
    return null;
  }

  return BILLING_PLAN_IDS.includes(raw as BillingPlanId)
    ? (raw as BillingPlanId)
    : null;
}

export function readMetadataTier(
  metadata: Record<string, unknown>,
): PricingTierId | null {
  const raw = metadata.tier;
  if (typeof raw !== "string") {
    return null;
  }

  return PRICING_TIER_IDS.includes(raw as PricingTierId)
    ? (raw as PricingTierId)
    : null;
}

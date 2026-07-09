import type { BillingPlanId } from "../config/plans";
import type { PricingTierId } from "../config/pricing-tiers";

export const POLAR_PRODUCT_NAMESPACE = "nullxes_digital_employees";

export const BILLING_PLAN_IDS: BillingPlanId[] = [
  "free",
  "studio",
  "operator",
  "scale",
  "enterprise",
  "government",
];

export const PRICING_TIER_IDS: PricingTierId[] = [
  "free",
  "studio",
  "operator",
  "scale",
  "discovery",
  "pilot",
  "department",
  "holding",
  "flagship",
];

export function readMetadataPlan(
  metadata: Record<string, unknown>,
): BillingPlanId | null {
  const raw = metadata.plan;
  if (typeof raw !== "string") {
    return null;
  }

  if (raw === "super_pro") {
    return "scale";
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

  if (raw === "super_pro" || raw === "ultra") {
    return raw === "ultra" ? "flagship" : "scale";
  }

  // Marketing alias: Team UI maps to operator tier id.
  if (raw === "team") {
    return "operator";
  }

  return PRICING_TIER_IDS.includes(raw as PricingTierId)
    ? (raw as PricingTierId)
    : null;
}

export function readMetadataInterval(
  metadata: Record<string, unknown>,
): "month" | "year" | null {
  const raw = metadata.interval;
  if (raw === "month" || raw === "year") {
    return raw;
  }
  return null;
}

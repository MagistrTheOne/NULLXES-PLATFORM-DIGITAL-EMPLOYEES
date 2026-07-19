import type { BillingInterval, BillingPlanId } from "./plans";
import type { PricingTierId } from "./pricing-tiers";

/**
 * RUB charge amounts for T-Bank (kopecks via getRubAmountKopecks).
 * UI presentment for EN uses USD — see display-pricing.ts.
 * Charm pricing; annual ≈ −20%.
 */
const RUB_MONTHLY: Partial<Record<PricingTierId, number>> = {
  free: 0,
  starter: 4_990,
  studio: 14_990,
  operator: 49_990,
  scale: 149_990,
};

const RUB_ANNUAL: Partial<Record<PricingTierId, number>> = {
  starter: 47_904,
  studio: 143_904,
  operator: 479_904,
  scale: 1_439_904,
};

export type SelfServeCheckoutPlanId =
  | "starter"
  | "studio"
  | "operator"
  | "scale";

export function getRubAmountRubles(
  planId: SelfServeCheckoutPlanId,
  interval: BillingInterval,
): number | null {
  if (interval === "year") {
    return RUB_ANNUAL[planId] ?? null;
  }
  return RUB_MONTHLY[planId] ?? null;
}

export function getRubAmountKopecks(
  planId: SelfServeCheckoutPlanId,
  interval: BillingInterval,
): number | null {
  const rubles = getRubAmountRubles(planId, interval);
  return rubles == null ? null : rubles * 100;
}

export function formatRubAmount(amount: number, locale: string): string {
  return `${amount.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} ₽`;
}

export function getRubTierPrice(
  tierId: PricingTierId,
  interval: BillingInterval,
  locale: string,
): {
  priceLabel: string;
  priceNoteKey: "rfNoCard" | "perMonth" | "perYear" | "sales";
} | null {
  if (tierId === "free") {
    return { priceLabel: formatRubAmount(0, locale), priceNoteKey: "rfNoCard" };
  }

  if (
    tierId === "discovery" ||
    tierId === "pilot" ||
    tierId === "department" ||
    tierId === "holding" ||
    tierId === "flagship"
  ) {
    return null;
  }

  if (interval === "year") {
    const annual = RUB_ANNUAL[tierId];
    if (annual == null) return null;
    return {
      priceLabel: formatRubAmount(annual, locale),
      priceNoteKey: "perYear",
    };
  }

  const monthly = RUB_MONTHLY[tierId];
  if (monthly == null) return null;
  return {
    priceLabel: formatRubAmount(monthly, locale),
    priceNoteKey: "perMonth",
  };
}

/** Encode plan into OrderId (≤50 chars). Example: nx-starter-m-1720000000-a1b2c3d4 */
export function buildTbankOrderId(input: {
  planId: SelfServeCheckoutPlanId;
  interval: BillingInterval;
  suffix: string;
}): string {
  const intervalCode = input.interval === "year" ? "y" : "m";
  return `nx-${input.planId}-${intervalCode}-${input.suffix}`.slice(0, 50);
}

export function parseTbankOrderId(orderId: string): {
  planId: SelfServeCheckoutPlanId | null;
  interval: BillingInterval | null;
} {
  const match = orderId.match(/^nx-(starter|studio|operator|scale)-([my])-/);
  if (!match) {
    return { planId: null, interval: null };
  }
  return {
    planId: match[1] as SelfServeCheckoutPlanId,
    interval: match[2] === "y" ? "year" : "month",
  };
}

export function toBillingPlanId(
  planId: SelfServeCheckoutPlanId,
): BillingPlanId {
  return planId;
}

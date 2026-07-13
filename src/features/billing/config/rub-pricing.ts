import type { BillingInterval, BillingPlanId } from "./plans";
import type { PricingTierId } from "./pricing-tiers";

/**
 * Provisional RUB presentment for T-Bank checkout (same merchant for en + ru).
 */
const RUB_MONTHLY: Partial<Record<PricingTierId, number>> = {
  free: 0,
  studio: 4_900,
  operator: 19_900,
  scale: 59_900,
};

const RUB_ANNUAL: Partial<Record<PricingTierId, number>> = {
  studio: 47_000,
  operator: 191_000,
  scale: 575_000,
};

export type SelfServeCheckoutPlanId = "studio" | "operator" | "scale";

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

/** Encode plan into OrderId (≤50 chars). Example: nx-studio-m-1720000000-a1b2c3d4 */
export function buildTbankOrderId(input: {
  planId: SelfServeCheckoutPlanId | "test";
  interval?: BillingInterval;
  suffix: string;
}): string {
  const intervalCode =
    input.planId === "test" ? "t" : input.interval === "year" ? "y" : "m";
  return `nx-${input.planId}-${intervalCode}-${input.suffix}`.slice(0, 50);
}

export function parseTbankOrderId(orderId: string): {
  planId: SelfServeCheckoutPlanId | "test" | null;
  interval: BillingInterval | null;
} {
  const match = orderId.match(/^nx-(studio|operator|scale|test)-([myt])-/);
  if (!match) {
    return { planId: null, interval: null };
  }
  const planId = match[1] as SelfServeCheckoutPlanId | "test";
  if (planId === "test") {
    return { planId: "test", interval: null };
  }
  return {
    planId,
    interval: match[2] === "y" ? "year" : "month",
  };
}

export function toBillingPlanId(
  planId: SelfServeCheckoutPlanId,
): BillingPlanId {
  return planId;
}

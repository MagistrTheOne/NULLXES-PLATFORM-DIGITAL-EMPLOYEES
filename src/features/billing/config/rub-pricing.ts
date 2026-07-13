import type { BillingInterval } from "./plans";
import type { PricingTierId } from "./pricing-tiers";

/**
 * Provisional RUB presentment for T-Bank checkout (same merchant for en + ru).
 * Exact commercial RUB list can replace these without touching Polar USD catalog.
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

export function formatRubAmount(amount: number, locale: string): string {
  return `${amount.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} ₽`;
}

export function getRubTierPrice(
  tierId: PricingTierId,
  interval: BillingInterval,
  locale: string,
): { priceLabel: string; priceNoteKey: "rfNoCard" | "perMonth" | "perYear" | "sales" } | null {
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

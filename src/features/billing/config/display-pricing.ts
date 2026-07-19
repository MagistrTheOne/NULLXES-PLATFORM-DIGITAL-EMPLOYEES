import {
  SELF_SERVE_PRICE_CENTS,
  type BillingInterval,
} from "@/features/billing/config/plans";
import {
  getRubTierPrice,
  type SelfServeCheckoutPlanId,
} from "@/features/billing/config/rub-pricing";
import type { PricingTierId } from "@/features/billing/config/pricing-tiers";

const SELF_SERVE_IDS = new Set<string>([
  "starter",
  "studio",
  "operator",
  "scale",
]);

function isSelfServePlanId(tierId: string): tierId is SelfServeCheckoutPlanId {
  return SELF_SERVE_IDS.has(tierId);
}

/** UI presentment locale: RUB for ru, USD otherwise. */
export function isRubPresentmentLocale(locale: string): boolean {
  return locale === "ru" || locale.startsWith("ru-");
}

export function formatUsdCents(cents: number, locale: string): string {
  const intlLocale = isRubPresentmentLocale(locale) ? "ru-RU" : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Locale-aware plan/tier label for UI.
 * Charge currency is always RUB via T-Bank; this is presentment only.
 */
export function getTierDisplayPrice(
  tierId: PricingTierId,
  interval: BillingInterval,
  locale: string,
): {
  priceLabel: string;
  priceNoteKey: "rfNoCard" | "perMonth" | "perYear" | "sales";
} | null {
  if (isRubPresentmentLocale(locale)) {
    return getRubTierPrice(tierId, interval, locale);
  }

  if (tierId === "free") {
    return {
      priceLabel: formatUsdCents(0, locale),
      priceNoteKey: "rfNoCard",
    };
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

  if (!isSelfServePlanId(tierId)) {
    return null;
  }

  const cents = SELF_SERVE_PRICE_CENTS[tierId][interval];
  return {
    priceLabel: formatUsdCents(cents, locale),
    priceNoteKey: interval === "year" ? "perYear" : "perMonth",
  };
}

/** T-Bank payment form language (not charge currency). */
export function tbankFormLanguage(locale: string | null | undefined): "ru" | "en" {
  if (!locale) return "ru";
  return isRubPresentmentLocale(locale) ? "ru" : "en";
}

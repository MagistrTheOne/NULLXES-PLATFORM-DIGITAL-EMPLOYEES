/**
 * Capsule SKU helpers for T-Bank OrderId (≤50 chars).
 * Example: nx-cap-standard-1720000000-a1b2c3d4
 *
 * Beta smoke: paid capsules charge 10 ₽ until real pricing is restored.
 * EN UI shows USD cents presentment; charge stays RUB.
 */

import type { CapsuleTierId } from "@/features/rewards/lib/catalog";
import {
  formatUsdCents,
  isRubPresentmentLocale,
} from "@/features/billing/config/display-pricing";

export type PaidCapsuleTierId = Extract<CapsuleTierId, "standard" | "executive">;

/** Temporary checkout amount for Diamond / Gold smoke tests (RUB). */
const CAPSULE_RUB: Record<PaidCapsuleTierId, number> = {
  standard: 10,
  executive: 10,
};

/** EN presentment while smoke charge is 10 ₽. */
const CAPSULE_USD_CENTS: Record<PaidCapsuleTierId, number> = {
  standard: 10,
  executive: 10,
};

/** Marker row in capsule_open_event for purchase→holding grants (not a real drop). */
export const CAPSULE_HOLDING_GRANT_SLUG = "__holding_grant__";

export function isPaidCapsuleTierId(value: string): value is PaidCapsuleTierId {
  return value === "standard" || value === "executive";
}

export function getCapsuleRubAmount(tierId: PaidCapsuleTierId): number {
  return CAPSULE_RUB[tierId];
}

export function getCapsuleRubAmountKopecks(tierId: PaidCapsuleTierId): number {
  return getCapsuleRubAmount(tierId) * 100;
}

export function getCapsulePriceLabel(
  tierId: CapsuleTierId,
  locale = "ru",
): string | null {
  if (tierId === "daily") return null;
  if (!isPaidCapsuleTierId(tierId)) return null;

  if (isRubPresentmentLocale(locale)) {
    return `${CAPSULE_RUB[tierId].toLocaleString("ru-RU")} ₽`;
  }

  return formatUsdCents(CAPSULE_USD_CENTS[tierId], locale);
}

export function buildTbankCapsuleOrderId(input: {
  tierId: PaidCapsuleTierId;
  suffix: string;
}): string {
  return `nx-cap-${input.tierId}-${input.suffix}`.slice(0, 50);
}

export function parseTbankCapsuleOrderId(orderId: string): {
  tierId: PaidCapsuleTierId | null;
} {
  const match = orderId.match(/^nx-cap-(standard|executive)-/);
  if (!match) {
    return { tierId: null };
  }
  return { tierId: match[1] as PaidCapsuleTierId };
}

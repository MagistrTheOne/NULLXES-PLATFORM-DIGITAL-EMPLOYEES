/**
 * Capsule SKU helpers for T-Bank OrderId (≤50 chars).
 * Example: nx-cap-standard-1720000000-a1b2c3d4
 *
 * Test harness: set CAPSULE_CHECKOUT_TEST=1 (and optionally
 * NEXT_PUBLIC_CAPSULE_CHECKOUT_TEST=1 for client labels) to charge 10 ₽.
 */

import type { CapsuleTierId } from "@/features/rewards/lib/catalog";

export type PaidCapsuleTierId = Extract<CapsuleTierId, "standard" | "executive">;

const CAPSULE_RUB: Record<PaidCapsuleTierId, number> = {
  standard: 99,
  executive: 4_999,
};

const TEST_RUB = 10;

/** Marker row in capsule_open_event for purchase→holding grants (not a real drop). */
export const CAPSULE_HOLDING_GRANT_SLUG = "__holding_grant__";

export function isCapsuleCheckoutTestMode(): boolean {
  const server = process.env.CAPSULE_CHECKOUT_TEST?.trim().toLowerCase();
  const pub = process.env.NEXT_PUBLIC_CAPSULE_CHECKOUT_TEST?.trim().toLowerCase();
  return server === "1" || server === "true" || pub === "1" || pub === "true";
}

export function isPaidCapsuleTierId(value: string): value is PaidCapsuleTierId {
  return value === "standard" || value === "executive";
}

export function getCapsuleRubAmount(tierId: PaidCapsuleTierId): number {
  if (isCapsuleCheckoutTestMode()) {
    return TEST_RUB;
  }
  return CAPSULE_RUB[tierId];
}

export function getCapsuleRubAmountKopecks(tierId: PaidCapsuleTierId): number {
  return getCapsuleRubAmount(tierId) * 100;
}

export function getCapsulePriceLabel(tierId: CapsuleTierId): string | null {
  if (tierId === "daily") return null;
  if (!isPaidCapsuleTierId(tierId)) return null;
  if (isCapsuleCheckoutTestMode()) {
    return "10 ₽";
  }
  const rub = CAPSULE_RUB[tierId];
  return `${rub.toLocaleString("ru-RU")} ₽`;
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

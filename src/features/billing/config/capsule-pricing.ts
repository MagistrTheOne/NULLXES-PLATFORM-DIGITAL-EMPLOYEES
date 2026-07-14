/**
 * Capsule SKU helpers for T-Bank OrderId (≤50 chars).
 * Example: nx-cap-standard-1720000000-a1b2c3d4
 *
 * Beta smoke: paid capsules charge 10 ₽ until real pricing is restored.
 */

import type { CapsuleTierId } from "@/features/rewards/lib/catalog";

export type PaidCapsuleTierId = Extract<CapsuleTierId, "standard" | "executive">;

/** Temporary checkout amount for Diamond / Gold smoke tests. */
const CAPSULE_RUB: Record<PaidCapsuleTierId, number> = {
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

export function getCapsulePriceLabel(tierId: CapsuleTierId): string | null {
  if (tierId === "daily") return null;
  if (!isPaidCapsuleTierId(tierId)) return null;
  return `${CAPSULE_RUB[tierId].toLocaleString("ru-RU")} ₽`;
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

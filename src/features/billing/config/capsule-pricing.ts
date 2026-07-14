/**
 * Capsule SKU helpers for T-Bank OrderId (≤50 chars).
 * Example: nx-cap-standard-1720000000-a1b2c3d4
 */

import type { CapsuleTierId } from "@/features/rewards/lib/catalog";

export type PaidCapsuleTierId = Extract<CapsuleTierId, "standard" | "executive">;

const CAPSULE_RUB: Record<PaidCapsuleTierId, number> = {
  standard: 99,
  executive: 4_999,
};

export function isPaidCapsuleTierId(value: string): value is PaidCapsuleTierId {
  return value === "standard" || value === "executive";
}

export function getCapsuleRubAmount(tierId: PaidCapsuleTierId): number {
  return CAPSULE_RUB[tierId];
}

export function getCapsuleRubAmountKopecks(tierId: PaidCapsuleTierId): number {
  return CAPSULE_RUB[tierId] * 100;
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

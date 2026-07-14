import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { organization } from "@/entities/organization/schema";
import {
  parseTbankOrderId,
  toBillingPlanId,
} from "@/features/billing/config/rub-pricing";
import { parseTbankCapsuleOrderId } from "@/features/billing/config/capsule-pricing";
import { grantCapsuleHolding } from "@/features/rewards/services/open-capsule";

/**
 * Apply T-Bank CONFIRMED notification.
 * - Plan OrderId (nx-studio-m-…) → billing_plan
 * - Capsule OrderId (nx-cap-standard-…) → capsule holding
 * CustomerKey = organization.id
 */
export async function applyTbankPaymentConfirmation(input: {
  orderId: string;
  customerKey?: string;
  status?: string;
  success?: boolean | string;
}): Promise<{ updated: boolean; reason: string }> {
  const success =
    input.success === true ||
    input.success === "true" ||
    String(input.success).toLowerCase() === "true";
  const status = String(input.status ?? "").toUpperCase();

  if (!success || (status !== "CONFIRMED" && status !== "AUTHORIZED")) {
    return { updated: false, reason: "not_confirmed" };
  }

  const organizationId = input.customerKey?.trim();
  if (!organizationId) {
    return { updated: false, reason: "missing_customer_key" };
  }

  const capsule = parseTbankCapsuleOrderId(input.orderId);
  if (capsule.tierId) {
    await grantCapsuleHolding({
      organizationId,
      tierId: capsule.tierId,
      amount: 1,
    });
    return { updated: true, reason: `capsule_${capsule.tierId}` };
  }

  const parsed = parseTbankOrderId(input.orderId);
  if (!parsed.planId) {
    return { updated: false, reason: "unknown_order" };
  }

  const billingPlan = toBillingPlanId(parsed.planId);

  await db
    .update(organization)
    .set({
      billingPlan,
      updatedAt: new Date(),
    })
    .where(eq(organization.id, organizationId));

  return { updated: true, reason: `plan_${billingPlan}` };
}

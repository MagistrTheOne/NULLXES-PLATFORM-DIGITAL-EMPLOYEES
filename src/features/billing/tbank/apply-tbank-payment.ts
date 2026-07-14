import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { organization } from "@/entities/organization/schema";
import { capsuleOpenEvent } from "@/entities/reward";
import {
  parseTbankOrderId,
  toBillingPlanId,
} from "@/features/billing/config/rub-pricing";
import {
  CAPSULE_HOLDING_GRANT_SLUG,
  parseTbankCapsuleOrderId,
} from "@/features/billing/config/capsule-pricing";
import { grantCapsuleHolding } from "@/features/rewards/services/open-capsule";

/**
 * Apply T-Bank CONFIRMED notification.
 * - Plan OrderId (nx-studio-m-…) → billing_plan
 * - Capsule OrderId (nx-cap-standard-…) → capsule holding (idempotent by paymentOrderId)
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
    const prior = await db
      .select({ id: capsuleOpenEvent.id })
      .from(capsuleOpenEvent)
      .where(eq(capsuleOpenEvent.paymentOrderId, input.orderId))
      .limit(1);

    if (prior[0]) {
      return { updated: false, reason: "already_applied" };
    }

    await grantCapsuleHolding({
      organizationId,
      tierId: capsule.tierId,
      amount: 1,
    });

    await db.insert(capsuleOpenEvent).values({
      organizationId,
      tierId: capsule.tierId,
      source: "purchase",
      rewardSlug: CAPSULE_HOLDING_GRANT_SLUG,
      paymentOrderId: input.orderId,
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

import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { organization } from "@/entities/organization/schema";
import {
  parseTbankOrderId,
  toBillingPlanId,
} from "@/features/billing/config/rub-pricing";

/**
 * Apply T-Bank CONFIRMED notification to organization billing_plan.
 * CustomerKey = organization.id; OrderId encodes plan (nx-studio-m-…).
 * Test orders (nx-test-…) do not change the plan.
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

  const parsed = parseTbankOrderId(input.orderId);
  if (!parsed.planId || parsed.planId === "test") {
    return { updated: false, reason: "test_or_unknown_order" };
  }

  const organizationId = input.customerKey?.trim();
  if (!organizationId) {
    return { updated: false, reason: "missing_customer_key" };
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

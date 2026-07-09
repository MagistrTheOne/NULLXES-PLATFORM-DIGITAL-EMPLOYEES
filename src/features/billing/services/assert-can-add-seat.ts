import { count, eq } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { organization } from "@/entities/organization/schema";
import { db } from "@/shared/db/client";
import { BILLING_PLANS } from "../config/plans";
import { resolveBillingPlanId } from "../lib/resolve-billing-plan";

export async function assertCanAddSeat(input: {
  organizationId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const [org] = await db
    .select({ billingPlan: organization.billingPlan })
    .from(organization)
    .where(eq(organization.id, input.organizationId))
    .limit(1);

  if (!org) {
    return { ok: false, message: "Organization not found" };
  }

  const planId = resolveBillingPlanId(org.billingPlan);
  const maxSeats = BILLING_PLANS[planId].limits.maxSeats;
  if (maxSeats == null) {
    return { ok: true };
  }

  const [row] = await db
    .select({ total: count() })
    .from(membership)
    .where(eq(membership.organizationId, input.organizationId));

  const total = Number(row?.total ?? 0);
  if (total >= maxSeats) {
    return {
      ok: false,
      message: `${BILLING_PLANS[planId].name} includes ${maxSeats} seat${maxSeats === 1 ? "" : "s"}. Upgrade Team or Scale, or contact sales for Digital Department Deployment.`,
    };
  }

  return { ok: true };
}

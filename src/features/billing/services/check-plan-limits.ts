import { count, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import {
  BILLING_PLANS,
  type BillingPlanId,
} from "@/features/billing/config/plans";

export async function assertCanCreateEmployee(
  organizationId: string,
  billingPlan: BillingPlanId,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const limit = BILLING_PLANS[billingPlan].limits.maxEmployees;

  if (limit == null) {
    return { ok: true };
  }

  const [row] = await db
    .select({ total: count() })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.organizationId, organizationId));

  const total = Number(row?.total ?? 0);

  if (total >= limit) {
    return {
      ok: false,
      message: `Your plan allows ${limit} digital employee. Upgrade to Super Pro for unlimited workforce.`,
    };
  }

  return { ok: true };
}

export function getSessionLimitSecondsForPlan(billingPlan: BillingPlanId): number {
  return BILLING_PLANS[billingPlan].limits.maxSessionSeconds ?? 3600;
}

export function assertCanCreateCustomAvatar(
  billingPlan: BillingPlanId,
): { ok: true } | { ok: false; message: string } {
  if (BILLING_PLANS[billingPlan].limits.allowCustomAvatars) {
    return { ok: true };
  }

  return {
    ok: false,
    message:
      "Custom avatars are available on Super Pro and Enterprise. Choose a preset avatar or upgrade your plan.",
  };
}

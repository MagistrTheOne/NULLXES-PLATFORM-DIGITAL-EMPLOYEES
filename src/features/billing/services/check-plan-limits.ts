import { count, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import {
  BILLING_PLANS,
  type ApiAccessLevel,
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
      message: `Your plan allows ${limit} digital employee${limit === 1 ? "" : "s"}. Launch Studio, Operator, or Scale — or contact sales for Digital Department Deployment.`,
    };
  }

  return { ok: true };
}

export function getSessionLimitSecondsForPlan(billingPlan: BillingPlanId): number {
  return BILLING_PLANS[billingPlan].limits.maxSessionSeconds ?? 3600;
}

export function getTalkMinutesPerMonthForPlan(
  billingPlan: BillingPlanId,
): number | null {
  return BILLING_PLANS[billingPlan].limits.maxTalkMinutesPerMonth;
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
      "Custom avatars start on Studio. Choose a NULLXES preset on Evaluation, or upgrade your plan.",
  };
}

export function planApiAccess(billingPlan: BillingPlanId): ApiAccessLevel {
  return BILLING_PLANS[billingPlan].limits.apiAccess;
}

export function planAllowsApiAccess(
  billingPlan: BillingPlanId,
  required: ApiAccessLevel = "read",
): boolean {
  const access = planApiAccess(billingPlan);
  if (required === "none") return true;
  if (required === "read") return access === "read" || access === "full";
  return access === "full";
}

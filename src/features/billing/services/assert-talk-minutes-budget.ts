import { and, eq, gte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { organization } from "@/entities/organization/schema";
import { db } from "@/shared/db/client";
import { BILLING_PLANS } from "../config/plans";
import { resolveBillingPlanId } from "../lib/resolve-billing-plan";

function startOfUtcMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function assertTalkMinutesBudget(input: {
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
  const limitMinutes = BILLING_PLANS[planId].limits.maxTalkMinutesPerMonth;
  if (limitMinutes == null) {
    return { ok: true };
  }

  const monthStart = startOfUtcMonth();
  const [row] = await db
    .select({
      totalSeconds: sql<number>`coalesce(sum(${employeeSession.durationSeconds}), 0)`.mapWith(
        Number,
      ),
    })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(employeeSession.employeeId, digitalEmployee.id),
    )
    .where(
      and(
        eq(digitalEmployee.organizationId, input.organizationId),
        gte(employeeSession.startedAt, monthStart),
      ),
    );

  const usedMinutes = Math.ceil(Number(row?.totalSeconds ?? 0) / 60);
  if (usedMinutes >= limitMinutes) {
    return {
      ok: false,
      message: `Monthly Talk budget reached (${limitMinutes} min on ${BILLING_PLANS[planId].name}). Upgrade Studio, Operator, or Scale — or contact sales.`,
    };
  }

  return { ok: true };
}

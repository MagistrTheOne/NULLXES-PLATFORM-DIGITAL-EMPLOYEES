import { and, count, eq, gte } from "drizzle-orm";
import { employeeScenarioSession } from "@/entities/employee-scenario-session/schema";
import {
  BILLING_PLANS,
  type BillingPlanId,
} from "@/features/billing/config/plans";
import { db } from "@/shared/db/client";

const FREE_SCENARIO_MONTHLY_LIMIT = 3;

function startOfUtcMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function getScenarioMonthlyLimitForPlan(
  billingPlan: BillingPlanId,
): number | null {
  if (billingPlan === "free") {
    return FREE_SCENARIO_MONTHLY_LIMIT;
  }
  return null;
}

export async function assertCanStartScenario(input: {
  organizationId: string;
  userId: string;
  billingPlan: BillingPlanId;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const limit = getScenarioMonthlyLimitForPlan(input.billingPlan);
  if (limit == null) {
    return { ok: true };
  }

  const monthStart = startOfUtcMonth();
  const [row] = await db
    .select({ total: count() })
    .from(employeeScenarioSession)
    .where(
      and(
        eq(employeeScenarioSession.organizationId, input.organizationId),
        eq(employeeScenarioSession.userId, input.userId),
        gte(employeeScenarioSession.createdAt, monthStart),
      ),
    );

  const total = Number(row?.total ?? 0);
  if (total >= limit) {
    const planName = BILLING_PLANS[input.billingPlan].name;
    return {
      ok: false,
      message: `${planName} includes ${limit} scenarios per month. Upgrade to Super Pro for unlimited workforce simulations.`,
    };
  }

  return { ok: true };
}

export async function countScenariosThisMonth(input: {
  organizationId: string;
  userId: string;
}): Promise<number> {
  const monthStart = startOfUtcMonth();
  const [row] = await db
    .select({ total: count() })
    .from(employeeScenarioSession)
    .where(
      and(
        eq(employeeScenarioSession.organizationId, input.organizationId),
        eq(employeeScenarioSession.userId, input.userId),
        gte(employeeScenarioSession.createdAt, monthStart),
      ),
    );

  return Number(row?.total ?? 0);
}

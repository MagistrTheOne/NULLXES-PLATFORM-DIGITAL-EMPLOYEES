import { and, count, eq, notInArray } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { platformEmployeeCatalog } from "@/entities/platform-employee-catalog/schema";
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
  if (!BILLING_PLANS[billingPlan].limits.canCreateEmployees) {
    return {
      ok: false,
      message:
        "Evaluation includes 2 demo employees (Adeline + Yuki). Subscribe to Starter or higher to create custom digital employees.",
    };
  }

  const limit = BILLING_PLANS[billingPlan].limits.maxEmployees;

  if (limit == null) {
    return { ok: true };
  }

  // Platform catalog employees live in the NULLXES org — never count toward seats.
  const catalogRows = await db
    .select({ employeeId: platformEmployeeCatalog.employeeId })
    .from(platformEmployeeCatalog)
    .where(eq(platformEmployeeCatalog.isPublished, true));
  const catalogIds = catalogRows.map((row) => row.employeeId);

  const [row] = await db
    .select({ total: count() })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        catalogIds.length > 0
          ? notInArray(digitalEmployee.id, catalogIds)
          : undefined,
      ),
    );

  const total = Number(row?.total ?? 0);

  if (total >= limit) {
    return {
      ok: false,
      message: `Your plan allows ${limit} custom digital employee${limit === 1 ? "" : "s"} (NULLXES catalog does not count). Upgrade Team or Scale — or contact sales.`,
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
      "Custom avatars start on Starter. Choose a NULLXES preset on Evaluation, or upgrade your plan.",
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

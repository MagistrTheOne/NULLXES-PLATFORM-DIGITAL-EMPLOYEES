import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import {
  assertCanCreateEmployee,
  getSessionLimitSecondsForPlan,
} from "@/features/billing/services/check-plan-limits";
import { createDigitalEmployee } from "@/features/employee/use-cases/create-digital-employee";
import { organization } from "@/entities/organization/schema";
import { eq } from "drizzle-orm";
import { db } from "@/shared/db/client";

export async function createApiEmployee(input: {
  organizationId: string;
  actorUserId: string;
  name: string;
  role: string;
  description?: string;
}): Promise<
  | { ok: true; employeeId: string }
  | { ok: false; message: string; status: number }
> {
  const name = input.name.trim();
  const role = input.role.trim();

  if (!name || !role) {
    return { ok: false, message: "name and role are required", status: 400 };
  }

  const [org] = await db
    .select({ billingPlan: organization.billingPlan })
    .from(organization)
    .where(eq(organization.id, input.organizationId))
    .limit(1);

  if (!org) {
    return { ok: false, message: "Organization not found", status: 404 };
  }

  const billingPlan = resolveBillingPlanId(org.billingPlan);
  const limitCheck = await assertCanCreateEmployee(
    input.organizationId,
    billingPlan,
  );

  if (!limitCheck.ok) {
    return { ok: false, message: limitCheck.message, status: 403 };
  }

  const sessionLimitSeconds = getSessionLimitSecondsForPlan(billingPlan);
  const result = await createDigitalEmployee({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    name,
    role,
    description: input.description?.trim() || `${role} digital employee`,
    avatarProvider: "anam",
    brainProvider: "openai",
    systemPrompt: `You are ${name}, a ${role}. Operate professionally within your organization's digital workforce.`,
    sessionLimitSeconds,
    reason: "Created via Public API",
  });

  return { ok: true, employeeId: result.employee.id };
}

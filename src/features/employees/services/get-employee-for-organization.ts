import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { db } from "@/shared/db/client";
import { isPublishedPlatformCatalogEmployee } from "./platform-employee-catalog";

export async function getEmployeeForOrganization(
  organizationId: string,
  employeeId: string,
) {
  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    return null;
  }

  if (employee.organizationId === organizationId) {
    return employee;
  }

  const [callerOrg] = await db
    .select({ billingPlan: organization.billingPlan })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);
  const callerPlan = resolveBillingPlanId(callerOrg?.billingPlan ?? "free");
  if (
    !planAllowsCreateEmployees(callerPlan) &&
    (await isPublishedPlatformCatalogEmployee(employeeId))
  ) {
    return employee;
  }

  return null;
}

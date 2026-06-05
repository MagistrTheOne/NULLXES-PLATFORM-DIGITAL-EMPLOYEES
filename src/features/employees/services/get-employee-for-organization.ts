import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";

export async function getEmployeeForOrganization(
  organizationId: string,
  employeeId: string,
) {
  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee || employee.organizationId !== organizationId) {
    return null;
  }

  return employee;
}

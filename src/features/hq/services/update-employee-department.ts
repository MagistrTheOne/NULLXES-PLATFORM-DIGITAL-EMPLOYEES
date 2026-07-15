import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { forbidCatalogMutation } from "@/features/employees/services/platform-employee-catalog";
import { db } from "@/shared/db/client";
import type { HqDepartment } from "../types";

/**
 * Persist a manual department assignment, scoped to the organization so an
 * actor can never touch employees outside their workspace.
 */
export async function updateEmployeeDepartment(input: {
  organizationId: string;
  employeeId: string;
  department: HqDepartment | null;
}): Promise<boolean> {
  await forbidCatalogMutation(input.employeeId, input.organizationId);

  const updated = await db
    .update(digitalEmployee)
    .set({ department: input.department })
    .where(
      and(
        eq(digitalEmployee.id, input.employeeId),
        eq(digitalEmployee.organizationId, input.organizationId),
      ),
    )
    .returning({ id: digitalEmployee.id });

  return updated.length > 0;
}

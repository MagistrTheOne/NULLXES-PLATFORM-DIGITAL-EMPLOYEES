import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import { resolveEmployeeDepartment } from "@/features/hq/lib/map-employee-department";
import type { HqDepartment } from "@/features/hq/types";

/**
 * Employee ids that belong to a department, using the same resolution as the
 * HQ floor (stored department, falling back to the role heuristic). Lets
 * analytics scope session metrics to a department consistently with HQ.
 */
export async function getDepartmentEmployeeIds(
  organizationId: string,
  department: HqDepartment,
): Promise<string[]> {
  const rows = await db
    .select({
      id: digitalEmployee.id,
      department: digitalEmployee.department,
      role: digitalEmployee.role,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.organizationId, organizationId));

  return rows
    .filter((row) => resolveEmployeeDepartment(row.department, row.role) === department)
    .map((row) => row.id);
}

import { and, count, eq, inArray, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import type { EmployeeMetrics } from "../types";

export async function getEmployeeMetrics(
  organizationId: string,
  employeeIds?: string[],
): Promise<EmployeeMetrics> {
  const [row] = await db
    .select({
      totalEmployees: count(),
      activeEmployees:
        sql<number>`count(*) filter (where ${digitalEmployee.status} = 'active')`.mapWith(
          Number,
        ),
      pausedEmployees:
        sql<number>`count(*) filter (where ${digitalEmployee.status} = 'paused')`.mapWith(
          Number,
        ),
      draftEmployees:
        sql<number>`count(*) filter (where ${digitalEmployee.status} = 'draft')`.mapWith(
          Number,
        ),
      archivedEmployees:
        sql<number>`count(*) filter (where ${digitalEmployee.status} = 'archived')`.mapWith(
          Number,
        ),
    })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        employeeIds ? inArray(digitalEmployee.id, employeeIds) : undefined,
      ),
    );

  return {
    totalEmployees: Number(row?.totalEmployees ?? 0),
    activeEmployees: Number(row?.activeEmployees ?? 0),
    pausedEmployees: Number(row?.pausedEmployees ?? 0),
    draftEmployees: Number(row?.draftEmployees ?? 0),
    archivedEmployees: Number(row?.archivedEmployees ?? 0),
  };
}

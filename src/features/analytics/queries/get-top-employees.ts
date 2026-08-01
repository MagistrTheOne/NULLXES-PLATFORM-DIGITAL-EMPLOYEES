import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { withTenantContext } from "@/shared/db/with-tenant-context";
import { endOfUtcDay, startOfUtcDay } from "../lib/date-range";
import type { AnalyticsDateRange, TopEmployeeRow } from "../types";

const TOP_EMPLOYEE_LIMIT = 8;

export async function getTopEmployees(
  organizationId: string,
  range: AnalyticsDateRange,
  employeeIds?: string[],
): Promise<TopEmployeeRow[]> {
  return withTenantContext(organizationId, async (tx) => {
    const rows = await tx
      .select({
        employeeId: digitalEmployee.id,
        name: digitalEmployee.name,
        totalSessions: count(employeeSession.id),
        totalDurationSeconds:
          sql<number>`coalesce(sum(${employeeSession.durationSeconds}), 0)`.mapWith(
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
          eq(employeeSession.organizationId, organizationId),
          gte(employeeSession.startedAt, startOfUtcDay(range.from)),
          lte(employeeSession.startedAt, endOfUtcDay(range.to)),
          employeeIds ? inArray(digitalEmployee.id, employeeIds) : undefined,
        ),
      )
      .groupBy(digitalEmployee.id, digitalEmployee.name)
      .orderBy(desc(count(employeeSession.id)), desc(digitalEmployee.name))
      .limit(TOP_EMPLOYEE_LIMIT);

    return rows.map((row) => ({
      employeeId: row.employeeId,
      name: row.name,
      totalSessions: Number(row.totalSessions),
      totalDurationSeconds: Number(row.totalDurationSeconds),
    }));
  });
}

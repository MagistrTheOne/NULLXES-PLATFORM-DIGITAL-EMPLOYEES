import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { endOfUtcDay, startOfUtcDay } from "../lib/date-range";
import type { AnalyticsDateRange, TopEmployeeRow } from "../types";

const TOP_EMPLOYEE_LIMIT = 8;

export async function getTopEmployees(
  organizationId: string,
  range: AnalyticsDateRange,
  employeeIds?: string[],
): Promise<TopEmployeeRow[]> {
  const rows = await db
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
}

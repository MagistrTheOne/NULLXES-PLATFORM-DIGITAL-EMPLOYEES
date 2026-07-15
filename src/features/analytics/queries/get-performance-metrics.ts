import { and, count, eq, inArray, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { sessionStartedInRange } from "../lib/session-range-filter";
import type { AnalyticsDateRange, PerformanceMetrics } from "../types";

export async function getPerformanceMetrics(
  organizationId: string,
  range: AnalyticsDateRange,
  employeeIds?: string[],
): Promise<PerformanceMetrics> {
  const [row] = await db
    .select({
      completedSessions:
        sql<number>`count(*) filter (where ${employeeSession.status} = 'completed')`.mapWith(
          Number,
        ),
      averageFirstResponseMs:
        sql<number>`coalesce(round(avg(${employeeSession.firstResponseMs}) filter (where ${employeeSession.firstResponseMs} is not null)), 0)`.mapWith(
          Number,
        ),
      resolvedSessions:
        sql<number>`count(*) filter (where ${employeeSession.resolved} = true)`.mapWith(
          Number,
        ),
      escalatedSessions:
        sql<number>`count(*) filter (where ${employeeSession.escalated} = true)`.mapWith(
          Number,
        ),
      totalSessions: count(employeeSession.id),
    })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(employeeSession.employeeId, digitalEmployee.id),
    )
    .where(
      and(
        eq(employeeSession.organizationId, organizationId),
        sessionStartedInRange(range),
        employeeIds ? inArray(digitalEmployee.id, employeeIds) : undefined,
      ),
    );

  const totalSessions = Number(row?.totalSessions ?? 0);
  const completedSessions = Number(row?.completedSessions ?? 0);
  const resolvedSessions = Number(row?.resolvedSessions ?? 0);
  const escalatedSessions = Number(row?.escalatedSessions ?? 0);

  return {
    completedSessions,
    averageFirstResponseMs: Number(row?.averageFirstResponseMs ?? 0),
    resolutionRatePercent:
      completedSessions > 0
        ? Math.round((resolvedSessions / completedSessions) * 1000) / 10
        : 0,
    escalationRatePercent:
      totalSessions > 0
        ? Math.round((escalatedSessions / totalSessions) * 1000) / 10
        : 0,
  };
}

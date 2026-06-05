import { and, count, eq, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { sessionStartedInRange } from "../lib/session-range-filter";
import type { AnalyticsDateRange, SessionMetrics } from "../types";

export async function getSessionMetrics(
  organizationId: string,
  range?: AnalyticsDateRange,
): Promise<SessionMetrics> {
  const filters = [eq(digitalEmployee.organizationId, organizationId)];

  if (range) {
    filters.push(sessionStartedInRange(range)!);
  }

  const [row] = await db
    .select({
      totalSessions: count(employeeSession.id),
      completedSessions:
        sql<number>`count(*) filter (where ${employeeSession.status} = 'completed')`.mapWith(
          Number,
        ),
      averageSessionDurationSeconds:
        sql<number>`coalesce(round(avg(${employeeSession.durationSeconds}) filter (where ${employeeSession.durationSeconds} is not null)), 0)`.mapWith(
          Number,
        ),
      totalConversationSeconds:
        sql<number>`coalesce(sum(${employeeSession.durationSeconds}), 0)`.mapWith(
          Number,
        ),
    })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(employeeSession.employeeId, digitalEmployee.id),
    )
    .where(and(...filters));

  return {
    totalSessions: Number(row?.totalSessions ?? 0),
    completedSessions: Number(row?.completedSessions ?? 0),
    averageSessionDurationSeconds: Number(
      row?.averageSessionDurationSeconds ?? 0,
    ),
    totalConversationSeconds: Number(row?.totalConversationSeconds ?? 0),
  };
}

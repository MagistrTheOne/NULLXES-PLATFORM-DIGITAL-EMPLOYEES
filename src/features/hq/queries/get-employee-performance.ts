import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { endOfUtcDay, startOfUtcDay } from "@/features/analytics/lib/date-range";
import type { AnalyticsDateRange } from "@/features/analytics/types";

export type EmployeePerformance = {
  sessions: number;
  /** Total conversation time across sessions, in seconds. */
  conversationSeconds: number;
  /** Mean satisfaction rating (1-5) over rated sessions, or null if none. */
  satisfactionAvg: number | null;
};

export function emptyPerformance(): EmployeePerformance {
  return { sessions: 0, conversationSeconds: 0, satisfactionAvg: null };
}

/**
 * Per-employee performance aggregates for the HQ floor: session volume,
 * total conversation time and average satisfaction within the range. Keyed by
 * employee id so callers can bucket by the floor's resolved department.
 */
export async function getEmployeePerformance(
  organizationId: string,
  range: AnalyticsDateRange,
): Promise<Map<string, EmployeePerformance>> {
  const rows = await db
    .select({
      employeeId: employeeSession.employeeId,
      sessions: count(employeeSession.id),
      conversationSeconds:
        sql<number>`coalesce(sum(${employeeSession.durationSeconds}), 0)`.mapWith(
          Number,
        ),
      satisfactionAvg: sql<
        number | null
      >`avg(${employeeSession.satisfactionRating})`,
      satisfactionCount: count(employeeSession.satisfactionRating),
    })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(employeeSession.employeeId, digitalEmployee.id),
    )
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        gte(employeeSession.startedAt, startOfUtcDay(range.from)),
        lte(employeeSession.startedAt, endOfUtcDay(range.to)),
      ),
    )
    .groupBy(employeeSession.employeeId);

  return new Map(
    rows.map((row) => [
      row.employeeId,
      {
        sessions: Number(row.sessions),
        conversationSeconds: Number(row.conversationSeconds),
        satisfactionAvg:
          Number(row.satisfactionCount) > 0 && row.satisfactionAvg !== null
            ? Number(row.satisfactionAvg)
            : null,
      },
    ]),
  );
}

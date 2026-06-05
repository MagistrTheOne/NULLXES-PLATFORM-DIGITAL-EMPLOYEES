import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import {
  buildDateRange,
  endOfUtcDay,
  formatUtcDate,
  getPreviousAnalyticsRange,
  startOfUtcDay,
} from "../lib/date-range";
import type { AnalyticsDateRange, SessionTimeseriesPoint } from "../types";

async function querySessionCountsByDate(
  organizationId: string,
  range: AnalyticsDateRange,
): Promise<Map<string, { sessions: number; durationSeconds: number }>> {
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC'), 'YYYY-MM-DD')`,
      sessions: count(employeeSession.id),
      durationSeconds:
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
        eq(digitalEmployee.organizationId, organizationId),
        gte(employeeSession.startedAt, startOfUtcDay(range.from)),
        lte(employeeSession.startedAt, endOfUtcDay(range.to)),
      ),
    )
    .groupBy(sql`date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC')`)
    .orderBy(sql`date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC')`);

  return new Map(
    rows.map((row) => [
      row.date,
      {
        sessions: Number(row.sessions),
        durationSeconds: Number(row.durationSeconds),
      },
    ]),
  );
}

export async function getSessionTimeseries(
  organizationId: string,
  range: AnalyticsDateRange,
): Promise<SessionTimeseriesPoint[]> {
  const previousRange = getPreviousAnalyticsRange(range);
  const [currentRows, previousRows] = await Promise.all([
    querySessionCountsByDate(organizationId, range),
    querySessionCountsByDate(organizationId, previousRange),
  ]);

  const dates = buildDateRange(range);
  const previousDates = buildDateRange(previousRange);

  return dates.map((date, index) => {
    const point = currentRows.get(date);
    const previousDate = previousDates[index] ?? previousDates[previousDates.length - 1];
    const previousPoint = previousDate ? previousRows.get(previousDate) : undefined;

    return {
      date,
      sessions: point?.sessions ?? 0,
      durationSeconds: point?.durationSeconds ?? 0,
      previousSessions: previousPoint?.sessions ?? 0,
    };
  });
}

import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { buildDateRange, endOfUtcDay, startOfUtcDay } from "../lib/date-range";
import type { AnalyticsDateRange, SatisfactionTimeseriesPoint } from "../types";

export async function getSatisfactionTimeseries(
  organizationId: string,
  range: AnalyticsDateRange,
  employeeIds?: string[],
): Promise<SatisfactionTimeseriesPoint[]> {
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC'), 'YYYY-MM-DD')`,
      ratedSessions:
        sql<number>`count(*) filter (where ${employeeSession.satisfactionRating} is not null)`.mapWith(
          Number,
        ),
      averageRating:
        sql<number | null>`round(avg(${employeeSession.satisfactionRating}::numeric) filter (where ${employeeSession.satisfactionRating} is not null), 1)`.mapWith(
          (value) => (value === null ? null : Number(value)),
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
        employeeIds ? inArray(digitalEmployee.id, employeeIds) : undefined,
      ),
    )
    .groupBy(sql`date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC')`)
    .orderBy(sql`date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC')`);

  const byDate = new Map(
    rows.map((row) => [
      row.date,
      {
        ratedSessions: Number(row.ratedSessions),
        averageRating:
          row.averageRating === null || row.averageRating === undefined
            ? null
            : Number(row.averageRating),
      },
    ]),
  );

  return buildDateRange(range).map((date) => {
    const point = byDate.get(date);

    return {
      date,
      ratedSessions: point?.ratedSessions ?? 0,
      averageRating: point?.averageRating ?? null,
    };
  });
}

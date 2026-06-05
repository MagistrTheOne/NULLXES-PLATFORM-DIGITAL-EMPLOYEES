import { and, count, eq, gte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import type { SessionTimeseriesPoint } from "../types";

const TIMESERIES_DAYS = 30;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(): string[] {
  const today = startOfUtcDay(new Date());
  const dates: string[] = [];

  for (let offset = TIMESERIES_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - offset);
    dates.push(formatUtcDate(day));
  }

  return dates;
}

export async function getSessionTimeseries(
  organizationId: string,
): Promise<SessionTimeseriesPoint[]> {
  const rangeStart = startOfUtcDay(new Date());
  rangeStart.setUTCDate(rangeStart.getUTCDate() - (TIMESERIES_DAYS - 1));

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
        gte(employeeSession.startedAt, rangeStart),
      ),
    )
    .groupBy(sql`date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC')`)
    .orderBy(sql`date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC')`);

  const byDate = new Map(
    rows.map((row) => [
      row.date,
      {
        sessions: Number(row.sessions),
        durationSeconds: Number(row.durationSeconds),
      },
    ]),
  );

  return buildDateRange().map((date) => {
    const point = byDate.get(date);

    return {
      date,
      sessions: point?.sessions ?? 0,
      durationSeconds: point?.durationSeconds ?? 0,
    };
  });
}

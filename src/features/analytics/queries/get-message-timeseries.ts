import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { buildDateRange, endOfUtcDay, startOfUtcDay } from "../lib/date-range";
import type { AnalyticsDateRange, MessageTimeseriesPoint } from "../types";

export async function getMessageTimeseries(
  organizationId: string,
  range: AnalyticsDateRange,
  employeeIds?: string[],
): Promise<MessageTimeseriesPoint[]> {
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC'), 'YYYY-MM-DD')`,
      messages:
        sql<number>`coalesce(sum(${employeeSession.messageCount}), 0)`.mapWith(
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
        employeeIds ? inArray(digitalEmployee.id, employeeIds) : undefined,
      ),
    )
    .groupBy(sql`date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC')`)
    .orderBy(sql`date_trunc('day', ${employeeSession.startedAt} at time zone 'UTC')`);

  const byDate = new Map(
    rows.map((row) => [row.date, Number(row.messages)]),
  );

  return buildDateRange(range).map((date) => ({
    date,
    messages: byDate.get(date) ?? 0,
  }));
}

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { endOfUtcDay, startOfUtcDay } from "../lib/date-range";
import type { AnalyticsDateRange, TopicRow } from "../types";

export async function getTopTopics(
  organizationId: string,
  range: AnalyticsDateRange,
  limit = 6,
): Promise<TopicRow[]> {
  const rows = await db
    .select({
      topic: employeeSession.primaryTopic,
      sessionCount: count(employeeSession.id),
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
        sql`${employeeSession.primaryTopic} is not null`,
        sql`trim(${employeeSession.primaryTopic}) <> ''`,
      ),
    )
    .groupBy(employeeSession.primaryTopic)
    .orderBy(desc(count(employeeSession.id)))
    .limit(limit);

  const totalSessions = rows.reduce(
    (sum, row) => sum + Number(row.sessionCount),
    0,
  );

  return rows
    .filter((row) => row.topic)
    .map((row) => ({
      topic: row.topic!,
      sessionCount: Number(row.sessionCount),
      sharePercent:
        totalSessions > 0
          ? Math.round((Number(row.sessionCount) / totalSessions) * 100)
          : 0,
    }));
}

import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { withTenantContext } from "@/shared/db/with-tenant-context";
import { endOfUtcDay, startOfUtcDay } from "../lib/date-range";
import type { AnalyticsDateRange, TopicRow } from "../types";

export async function getTopTopics(
  organizationId: string,
  range: AnalyticsDateRange,
  limit = 6,
  employeeIds?: string[],
): Promise<TopicRow[]> {
  return withTenantContext(organizationId, async (tx) => {
    const rows = await tx
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
          eq(employeeSession.organizationId, organizationId),
          gte(employeeSession.startedAt, startOfUtcDay(range.from)),
          lte(employeeSession.startedAt, endOfUtcDay(range.to)),
          sql`${employeeSession.primaryTopic} is not null`,
          sql`trim(${employeeSession.primaryTopic}) <> ''`,
          employeeIds ? inArray(digitalEmployee.id, employeeIds) : undefined,
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
  });
}

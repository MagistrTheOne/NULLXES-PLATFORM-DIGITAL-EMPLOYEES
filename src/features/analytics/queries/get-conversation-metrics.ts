import { and, eq, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { sessionStartedInRange } from "../lib/session-range-filter";
import type { AnalyticsDateRange, ConversationMetrics } from "../types";

export async function getConversationMetrics(
  organizationId: string,
  range: AnalyticsDateRange,
): Promise<ConversationMetrics> {
  const [row] = await db
    .select({
      totalMessages:
        sql<number>`coalesce(sum(${employeeSession.messageCount}), 0)`.mapWith(
          Number,
        ),
      ratedSessions:
        sql<number>`count(*) filter (where ${employeeSession.satisfactionRating} is not null)`.mapWith(
          Number,
        ),
      averageSatisfaction:
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
        sessionStartedInRange(range),
      ),
    );

  return {
    totalMessages: Number(row?.totalMessages ?? 0),
    ratedSessions: Number(row?.ratedSessions ?? 0),
    averageSatisfaction:
      row?.averageSatisfaction === null || row?.averageSatisfaction === undefined
        ? null
        : Number(row.averageSatisfaction),
  };
}

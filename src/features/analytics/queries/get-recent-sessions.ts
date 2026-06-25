import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { endOfUtcDay, startOfUtcDay } from "../lib/date-range";
import type { AnalyticsDateRange, RecentSessionRow } from "../types";

export async function getRecentSessions(
  organizationId: string,
  range: AnalyticsDateRange,
  limit = 12,
  employeeIds?: string[],
): Promise<RecentSessionRow[]> {
  const rows = await db
    .select({
      id: employeeSession.id,
      employeeId: employeeSession.employeeId,
      employeeName: digitalEmployee.name,
      userEmail: user.email,
      status: employeeSession.status,
      messageCount: employeeSession.messageCount,
      satisfactionRating: employeeSession.satisfactionRating,
      durationSeconds: employeeSession.durationSeconds,
      startedAt: employeeSession.startedAt,
    })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(employeeSession.employeeId, digitalEmployee.id),
    )
    .innerJoin(user, eq(employeeSession.userId, user.id))
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        gte(employeeSession.startedAt, startOfUtcDay(range.from)),
        lte(employeeSession.startedAt, endOfUtcDay(range.to)),
        employeeIds ? inArray(digitalEmployee.id, employeeIds) : undefined,
      ),
    )
    .orderBy(desc(employeeSession.startedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    userEmail: row.userEmail,
    status: row.status,
    messageCount: Number(row.messageCount ?? 0),
    satisfactionRating:
      row.satisfactionRating === null || row.satisfactionRating === undefined
        ? null
        : Number(row.satisfactionRating),
    durationSeconds: row.durationSeconds,
    startedAt: row.startedAt,
  }));
}

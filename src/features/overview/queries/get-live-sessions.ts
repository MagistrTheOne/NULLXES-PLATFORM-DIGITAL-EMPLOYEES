import { and, desc, eq, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { employeeSession } from "@/entities/session/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import type { LiveSessionRow } from "../types";

const LIVE_SESSION_LIMIT = 12;

export async function getLiveSessions(
  organizationId: string,
): Promise<LiveSessionRow[]> {
  const rows = await db
    .select({
      id: employeeSession.id,
      employeeId: employeeSession.employeeId,
      employeeName: digitalEmployee.name,
      userEmail: user.email,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
    })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(employeeSession.employeeId, digitalEmployee.id),
    )
    .innerJoin(
      employeeRuntime,
      eq(employeeRuntime.employeeId, digitalEmployee.id),
    )
    .innerJoin(user, eq(employeeSession.userId, user.id))
    .where(
      and(
        eq(employeeSession.organizationId, organizationId),
        eq(employeeSession.status, "active"),
        sql`${employeeSession.startedAt} + (${employeeRuntime.sessionLimitSeconds} * interval '1 second') > now()`,
      ),
    )
    .orderBy(desc(employeeSession.startedAt))
    .limit(LIVE_SESSION_LIMIT);

  return rows;
}

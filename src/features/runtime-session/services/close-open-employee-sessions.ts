import { and, count, eq, inArray } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { applySessionDurationLimit } from "@/features/runtime-session/services/enforce-session-limit";
import { getEmployeeSessionLimitSeconds } from "@/features/runtime-session/services/get-employee-session-limit";
import { db } from "@/shared/db/client";

export type CloseOpenSessionsResult = {
  closedCount: number;
  sessionIds: string[];
};

export async function countOpenEmployeeSessions(input?: {
  organizationId?: string;
}): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, employeeSession.employeeId),
    )
    .where(
      and(
        inArray(employeeSession.status, ["created", "active"]),
        input?.organizationId
          ? eq(digitalEmployee.organizationId, input.organizationId)
          : undefined,
      ),
    );

  return Number(row?.total ?? 0);
}

/**
 * Marks all open talk sessions (created/active) as completed in the database.
 * Does not terminate live Anam WebRTC streams in the browser — users must end
 * those client-side; this clears stuck server-side session records.
 */
export async function closeOpenEmployeeSessions(input?: {
  organizationId?: string;
}): Promise<CloseOpenSessionsResult> {
  const openRows = await db
    .select({
      sessionId: employeeSession.id,
      employeeId: employeeSession.employeeId,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
    })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, employeeSession.employeeId),
    )
    .where(
      and(
        inArray(employeeSession.status, ["created", "active"]),
        input?.organizationId
          ? eq(digitalEmployee.organizationId, input.organizationId)
          : undefined,
      ),
    );

  const endedAt = new Date();
  const closedIds: string[] = [];

  for (const row of openRows) {
    const startedAt = row.startedAt ?? endedAt;
    const sessionLimitSeconds = await getEmployeeSessionLimitSeconds(
      row.employeeId,
    );
    const limited = applySessionDurationLimit({
      startedAt,
      endedAt,
      sessionLimitSeconds,
    });

    const updated = await db
      .update(employeeSession)
      .set({
        status: limited.status,
        endedAt,
        durationSeconds: limited.durationSeconds,
      })
      .where(
        and(
          eq(employeeSession.id, row.sessionId),
          inArray(employeeSession.status, ["created", "active"]),
        ),
      )
      .returning({ id: employeeSession.id });

    if (updated.length > 0) {
      closedIds.push(row.sessionId);
    }
  }

  return {
    closedCount: closedIds.length,
    sessionIds: closedIds,
  };
}

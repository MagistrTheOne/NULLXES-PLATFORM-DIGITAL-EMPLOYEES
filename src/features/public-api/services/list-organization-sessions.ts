import { and, desc, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";

export type ApiSessionListItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  messageCount: number;
};

export async function listOrganizationSessions(
  organizationId: string,
  limit = 50,
): Promise<ApiSessionListItem[]> {
  const rows = await db
    .select({
      id: employeeSession.id,
      employeeId: employeeSession.employeeId,
      employeeName: digitalEmployee.name,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
      endedAt: employeeSession.endedAt,
      durationSeconds: employeeSession.durationSeconds,
      messageCount: employeeSession.messageCount,
    })
    .from(employeeSession)
    .innerJoin(digitalEmployee, eq(digitalEmployee.id, employeeSession.employeeId))
    .where(eq(employeeSession.organizationId, organizationId))
    .orderBy(desc(employeeSession.startedAt))
    .limit(limit);

  return rows;
}

export async function getOrganizationSession(
  organizationId: string,
  sessionId: string,
): Promise<ApiSessionListItem | null> {
  const [row] = await db
    .select({
      id: employeeSession.id,
      employeeId: employeeSession.employeeId,
      employeeName: digitalEmployee.name,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
      endedAt: employeeSession.endedAt,
      durationSeconds: employeeSession.durationSeconds,
      messageCount: employeeSession.messageCount,
    })
    .from(employeeSession)
    .innerJoin(digitalEmployee, eq(digitalEmployee.id, employeeSession.employeeId))
    .where(
      and(
        eq(employeeSession.id, sessionId),
        eq(employeeSession.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

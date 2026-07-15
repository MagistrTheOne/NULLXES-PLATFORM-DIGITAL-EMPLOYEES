import { eq, inArray } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSessionMessage } from "@/entities/session-message/schema";
import { employeeSession } from "@/entities/session/schema";
import { listAuditEvents } from "@/features/security/queries/list-audit-events";
import { db } from "@/shared/db/client";

/**
 * Serialize an organization's exportable domain data into a JSON string.
 * Shared by the synchronous export action and the async export job so both
 * produce the same artifact.
 */
export async function buildOrganizationExportPayload(
  organizationId: string,
): Promise<string> {
  const [org] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      status: organization.status,
      billingPlan: organization.billingPlan,
      dataRegion: organization.dataRegion,
      createdAt: organization.createdAt,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  const employees = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      department: digitalEmployee.department,
      status: digitalEmployee.status,
      createdAt: digitalEmployee.createdAt,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.organizationId, organizationId));

  let sessionsSummary = {
    totalSessions: 0,
    completedSessions: 0,
    totalDurationSeconds: 0,
  };
  let sessions: Array<{
    id: string;
    employeeId: string;
    userId: string;
    status: string;
    startedAt: Date;
    endedAt: Date | null;
    durationSeconds: number | null;
    summary: string | null;
    primaryTopic: string | null;
    createdAt: Date;
  }> = [];
  let sessionTranscripts: Array<{
    sessionId: string;
    role: string;
    content: string;
    createdAt: Date;
  }> = [];

  sessions = await db
    .select({
      id: employeeSession.id,
      employeeId: employeeSession.employeeId,
      userId: employeeSession.userId,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
      endedAt: employeeSession.endedAt,
      durationSeconds: employeeSession.durationSeconds,
      summary: employeeSession.summary,
      primaryTopic: employeeSession.primaryTopic,
      createdAt: employeeSession.createdAt,
    })
    .from(employeeSession)
    .where(eq(employeeSession.organizationId, organizationId));

  sessionsSummary = {
    totalSessions: sessions.length,
    completedSessions: sessions.filter((row) => row.status === "completed")
      .length,
    totalDurationSeconds: sessions.reduce(
      (total, row) => total + (row.durationSeconds ?? 0),
      0,
    ),
  };

  const sessionIds = sessions.map((row) => row.id);
  if (sessionIds.length > 0) {
    sessionTranscripts = await db
      .select({
        sessionId: employeeSessionMessage.sessionId,
        role: employeeSessionMessage.role,
        content: employeeSessionMessage.content,
        createdAt: employeeSessionMessage.createdAt,
      })
      .from(employeeSessionMessage)
      .where(inArray(employeeSessionMessage.sessionId, sessionIds));
  }

  const recentAuditEvents = (
    await listAuditEvents({
      organizationId,
      limit: 50,
    })
  ).events;

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      organization: org ?? null,
      employees,
      sessionsSummary,
      sessions,
      sessionTranscripts,
      recentAuditEvents,
    },
    null,
    2,
  );
}

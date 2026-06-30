import { eq, inArray } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
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

  const employeeIds = employees.map((row) => row.id);

  let sessionsSummary = {
    totalSessions: 0,
    completedSessions: 0,
    totalDurationSeconds: 0,
  };

  if (employeeIds.length > 0) {
    const sessionRows = await db
      .select({
        status: employeeSession.status,
        durationSeconds: employeeSession.durationSeconds,
      })
      .from(employeeSession)
      .where(inArray(employeeSession.employeeId, employeeIds));

    sessionsSummary = {
      totalSessions: sessionRows.length,
      completedSessions: sessionRows.filter((row) => row.status === "completed")
        .length,
      totalDurationSeconds: sessionRows.reduce(
        (total, row) => total + (row.durationSeconds ?? 0),
        0,
      ),
    };
  }

  const recentAuditEvents = await listAuditEvents({
    organizationId,
    limit: 50,
  });

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      organization: org ?? null,
      employees,
      sessionsSummary,
      recentAuditEvents,
    },
    null,
    2,
  );
}

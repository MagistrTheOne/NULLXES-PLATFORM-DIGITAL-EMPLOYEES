import { and, eq, inArray, lt } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { recordAuditEvent } from "./record-audit-event";

export type RetentionPurgeResult = {
  organizationId: string;
  purgedSessions: number;
};

export async function runRetentionPurgeForOrganization(
  organizationId: string,
): Promise<RetentionPurgeResult> {
  const [settings] = await db
    .select({
      retentionPolicyDays: organizationSettings.retentionPolicyDays,
    })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);

  const retentionDays = settings?.retentionPolicyDays ?? 90;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const employeeRows = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.organizationId, organizationId));

  const employeeIds = employeeRows.map((row) => row.id);
  let purgedSessions = 0;

  if (employeeIds.length > 0) {
    const deleted = await db
      .delete(employeeSession)
      .where(
        and(
          inArray(employeeSession.employeeId, employeeIds),
          lt(employeeSession.createdAt, cutoff),
        ),
      )
      .returning({ id: employeeSession.id });

    purgedSessions = deleted.length;
  }

  await db
    .update(organizationSettings)
    .set({
      lastRetentionRunAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(organizationSettings.organizationId, organizationId));

  recordAuditEvent({
    organizationId,
    action: "retention.purged",
    resourceType: "organization",
    resourceId: organizationId,
    metadata: {
      purgedSessions,
      retentionPolicyDays: retentionDays,
      cutoff: cutoff.toISOString(),
    },
  });

  return { organizationId, purgedSessions };
}

export async function runRetentionPurgeForAllOrganizations(): Promise<{
  organizationsProcessed: number;
  totalSessionsPurged: number;
}> {
  const organizations = await db
    .select({ organizationId: organizationSettings.organizationId })
    .from(organizationSettings);

  let totalSessionsPurged = 0;

  for (const org of organizations) {
    const result = await runRetentionPurgeForOrganization(org.organizationId);
    totalSessionsPurged += result.purgedSessions;
  }

  return {
    organizationsProcessed: organizations.length,
    totalSessionsPurged,
  };
}

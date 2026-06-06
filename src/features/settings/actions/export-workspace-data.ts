"use server";

import { eq, inArray } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  assertTwoFactorForSensitiveAction,
  TwoFactorRequiredError,
} from "@/features/security/services/assert-two-factor-for-sensitive-action";
import { listAuditEvents } from "@/features/security/queries/list-audit-events";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { db } from "@/shared/db/client";
import { getSettingsPageData } from "../services/get-settings-page-data";

export async function exportWorkspaceDataAction(): Promise<
  { ok: true; payload: string } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to export workspace data." };
  }

  try {
    await assertTwoFactorForSensitiveAction({
      userId: session.user.id,
      role: workspace.membership.role,
      organizationId: workspace.organization.id,
    });
  } catch (error: unknown) {
    if (error instanceof TwoFactorRequiredError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const data = await getSettingsPageData(workspace);
  const organizationId = workspace.organization.id;

  const employeeRows = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.organizationId, organizationId));

  const employeeIds = employeeRows.map((row) => row.id);

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
    limit: 25,
  });

  recordAuditEvent({
    organizationId,
    actorUserId: session.user.id,
    actorRole: workspace.membership.role,
    action: "data.exported",
    resourceType: "organization",
    resourceId: organizationId,
  });

  return {
    ok: true,
    payload: JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        organization: data.organization,
        settings: data.settings,
        context: data.context,
        sessionsSummary,
        recentAuditEvents,
      },
      null,
      2,
    ),
  };
}

"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  assertTwoFactorForSensitiveAction,
  TwoFactorRequiredError,
} from "@/features/security/services/assert-two-factor-for-sensitive-action";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { buildOrganizationExportPayload } from "../services/build-organization-export";

export async function exportWorkspaceDataAction(): Promise<
  { ok: true; payload: string } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      message: "You do not have permission to export workspace data.",
    };
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

  const organizationId = workspace.organization.id;
  const payload = await buildOrganizationExportPayload(organizationId);

  recordAuditEvent({
    organizationId,
    actorUserId: session.user.id,
    actorRole: workspace.membership.role,
    action: "data.exported",
    resourceType: "organization",
    resourceId: organizationId,
  });

  return { ok: true, payload };
}

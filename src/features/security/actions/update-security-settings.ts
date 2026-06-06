"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { updateOrganizationSettings } from "@/features/settings/services/update-organization-settings";
import { recordAuditEvent } from "../services/record-audit-event";

export type UpdateSecuritySettingsInput = {
  requireTwoFactorForAdmins: boolean;
};

export type UpdateSecuritySettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateSecuritySettingsAction(
  input: UpdateSecuritySettingsInput,
): Promise<UpdateSecuritySettingsResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      message: "You do not have permission to update security settings.",
    };
  }

  const result = await updateOrganizationSettings({
    organizationId: workspace.organization.id,
    settings: {
      requireTwoFactorForAdmins: input.requireTwoFactorForAdmins,
    },
  });

  if (result.ok) {
    recordAuditEvent({
      organizationId: workspace.organization.id,
      actorUserId: session.user.id,
      actorRole: workspace.membership.role,
      action: "settings.updated",
      resourceType: "organization_settings",
      resourceId: workspace.organization.id,
      metadata: {
        requireTwoFactorForAdmins: input.requireTwoFactorForAdmins,
      },
    });
    revalidatePath("/settings");
  }

  return result;
}

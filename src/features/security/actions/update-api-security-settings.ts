"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { updateOrganizationSettings } from "@/features/settings/services/update-organization-settings";
import { recordAuditEvent } from "../services/record-audit-event";

export type UpdateApiSecuritySettingsInput = {
  apiIpAllowlist: string;
};

export type UpdateApiSecuritySettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateApiSecuritySettingsAction(
  input: UpdateApiSecuritySettingsInput,
): Promise<UpdateApiSecuritySettingsResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      message: "You do not have permission to update API security settings.",
    };
  }

  const allowlist = input.apiIpAllowlist.trim();

  const result = await updateOrganizationSettings({
    organizationId: workspace.organization.id,
    settings: {
      apiIpAllowlist: allowlist.length > 0 ? allowlist : null,
    },
  });

  if (result.ok) {
    recordAuditEvent({
      organizationId: workspace.organization.id,
      actorUserId: session.user.id,
      actorRole: workspace.membership.role,
      action: "settings.updated",
      resourceType: "api_security",
      resourceId: workspace.organization.id,
      metadata: {
        apiIpAllowlistEnabled: allowlist.length > 0,
      },
    });
    revalidatePath("/settings");
  }

  return result;
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { setLocaleCookie } from "@/shared/i18n/set-locale-cookie";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { updateOrganizationSettings } from "../services/update-organization-settings";

export type UpdateOrganizationPreferencesInput = {
  theme: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  defaultTimeRangeDays: number;
  compactMode: boolean;
};

export type UpdateOrganizationPreferencesResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateOrganizationPreferencesAction(
  input: UpdateOrganizationPreferencesInput,
): Promise<UpdateOrganizationPreferencesResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to update preferences." };
  }

  const result = await updateOrganizationSettings({
    organizationId: workspace.organization.id,
    settings: {
      theme: input.theme,
      language: input.language,
      dateFormat: input.dateFormat,
      timeFormat: input.timeFormat,
      defaultTimeRangeDays: input.defaultTimeRangeDays,
      compactMode: input.compactMode,
    },
  });

  if (result.ok) {
    recordAuditEvent({
      organizationId: workspace.organization.id,
      actorUserId: session.user.id,
      actorRole: workspace.membership.role,
      action: "settings.updated",
      resourceType: "organization_preferences",
      resourceId: workspace.organization.id,
      metadata: {
        language: input.language,
        theme: input.theme,
        dateFormat: input.dateFormat,
        timeFormat: input.timeFormat,
        defaultTimeRangeDays: input.defaultTimeRangeDays,
        compactMode: input.compactMode,
      },
    });
    await setLocaleCookie(input.language);
    revalidatePath("/settings");
    revalidatePath("/dashboard");
  }

  return result;
}

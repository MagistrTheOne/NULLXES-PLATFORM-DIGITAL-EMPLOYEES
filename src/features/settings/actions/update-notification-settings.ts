"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { updateOrganizationSettings } from "../services/update-organization-settings";

export type UpdateNotificationSettingsInput = {
  notifySessionCompleted: boolean;
  notifyEmployeeCreated: boolean;
  notifyKnowledgeFailed: boolean;
  notifyWeeklyDigest: boolean;
};

export async function updateNotificationSettingsAction(
  input: UpdateNotificationSettingsInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to update notifications." };
  }

  const result = await updateOrganizationSettings({
    organizationId: workspace.organization.id,
    settings: input,
  });

  if (result.ok) {
    revalidatePath("/settings");
  }

  return result;
}

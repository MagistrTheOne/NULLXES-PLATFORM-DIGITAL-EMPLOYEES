"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  assertTwoFactorForSensitiveAction,
  TwoFactorRequiredError,
} from "@/features/security/services/assert-two-factor-for-sensitive-action";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { updateOrganizationSettings } from "../services/update-organization-settings";

export type UpdateDataPrivacySettingsInput = {
  retentionPolicyDays: number;
};

export type UpdateDataPrivacySettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateDataPrivacySettingsAction(
  input: UpdateDataPrivacySettingsInput,
): Promise<UpdateDataPrivacySettingsResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to update data settings." };
  }

  if (input.retentionPolicyDays < 7 || input.retentionPolicyDays > 365) {
    return { ok: false, message: "Retention policy must be between 7 and 365 days." };
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

  const result = await updateOrganizationSettings({
    organizationId: workspace.organization.id,
    settings: {
      retentionPolicyDays: input.retentionPolicyDays,
    },
  });

  if (result.ok) {
    recordAuditEvent({
      organizationId: workspace.organization.id,
      actorUserId: session.user.id,
      actorRole: workspace.membership.role,
      action: "settings.updated",
      resourceType: "data_privacy",
      resourceId: workspace.organization.id,
      metadata: { retentionPolicyDays: input.retentionPolicyDays },
    });
    revalidatePath("/settings");
  }

  return result;
}

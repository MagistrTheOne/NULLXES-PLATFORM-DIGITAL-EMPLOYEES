"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { updateOrganizationSettings } from "@/features/settings/services/update-organization-settings";
import { encryptField } from "@/shared/crypto/field-encryption";
import {
  assertTwoFactorForSensitiveAction,
  TwoFactorRequiredError,
} from "../services/assert-two-factor-for-sensitive-action";
import { assertSafeOutboundUrl } from "@/shared/security/assert-safe-outbound-url";
import { recordAuditEvent } from "../services/record-audit-event";

export type UpdateOutboundWebhookSettingsInput = {
  outboundWebhookUrl: string;
  outboundWebhookSecret: string;
};

export type UpdateOutboundWebhookSettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateOutboundWebhookSettingsAction(
  input: UpdateOutboundWebhookSettingsInput,
): Promise<UpdateOutboundWebhookSettingsResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      message: "You do not have permission to update webhook settings.",
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

  const url = input.outboundWebhookUrl.trim();
  const secret = input.outboundWebhookSecret.trim();

  if (url.length > 0) {
    try {
      assertSafeOutboundUrl(url);
    } catch {
      return { ok: false, message: "Webhook URL host is not allowed." };
    }
  }

  const result = await updateOrganizationSettings({
    organizationId: workspace.organization.id,
    settings: {
      outboundWebhookUrl: url.length > 0 ? url : null,
      outboundWebhookSecret: secret.length > 0 ? encryptField(secret) : null,
    },
  });

  if (result.ok) {
    recordAuditEvent({
      organizationId: workspace.organization.id,
      actorUserId: session.user.id,
      actorRole: workspace.membership.role,
      action: "settings.updated",
      resourceType: "outbound_webhook",
      resourceId: workspace.organization.id,
      metadata: {
        outboundWebhookUrl: url.length > 0 ? url : null,
        secretConfigured: secret.length > 0,
      },
    });
    revalidatePath("/settings");
  }

  return result;
}

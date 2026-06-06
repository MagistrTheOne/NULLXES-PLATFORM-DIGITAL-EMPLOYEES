"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  assertTwoFactorForSensitiveAction,
  TwoFactorRequiredError,
} from "../services/assert-two-factor-for-sensitive-action";
import { recordAuditEvent } from "../services/record-audit-event";
import { revokeApiKey } from "../services/api-key";

export type RevokeApiKeyResult = { ok: true } | { ok: false; message: string };

export async function revokeApiKeyAction(
  keyId: string,
): Promise<RevokeApiKeyResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to revoke API keys." };
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

  await revokeApiKey({
    organizationId: workspace.organization.id,
    keyId,
  });

  recordAuditEvent({
    organizationId: workspace.organization.id,
    actorUserId: session.user.id,
    actorRole: workspace.membership.role,
    action: "api_key.revoked",
    resourceType: "api_key",
    resourceId: keyId,
  });

  revalidatePath("/settings");
  return { ok: true };
}

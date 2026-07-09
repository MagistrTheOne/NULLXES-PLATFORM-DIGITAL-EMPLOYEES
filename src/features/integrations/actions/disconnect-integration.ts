"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { disconnectIntegrationConnection } from "@/features/integrations/services/upsert-integration-connection";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";

export async function disconnectIntegrationAction(input: {
  provider: "slack" | "teams";
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to manage integrations." };
  }

  await disconnectIntegrationConnection({
    organizationId: workspace.organization.id,
    provider: input.provider,
  });

  recordAuditEvent({
    organizationId: workspace.organization.id,
    actorUserId: session.user.id,
    actorRole: workspace.membership.role,
    action: "integration.disconnected",
    resourceType: "integration",
    resourceId: input.provider,
  });

  revalidatePath("/settings");
  return { ok: true };
}

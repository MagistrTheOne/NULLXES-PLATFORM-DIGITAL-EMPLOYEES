"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { revokeOrganizationInvite } from "../services/revoke-organization-invite";

export async function revokeTeamInviteAction(
  inviteId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageMembers) {
    return { ok: false, message: "You do not have permission to manage invites." };
  }

  const result = await revokeOrganizationInvite({
    organizationId: workspace.organization.id,
    inviteId,
  });

  if (result.ok) {
    revalidatePath("/settings");
  }

  return result;
}

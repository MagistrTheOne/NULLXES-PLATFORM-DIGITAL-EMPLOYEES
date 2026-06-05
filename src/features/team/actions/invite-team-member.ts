"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { resolveWorkspacePermissions } from "@/features/workspace/services/resolve-workspace-permissions";
import type { MembershipRole } from "@/features/workspace/types";
import { createOrganizationInvite } from "../services/create-organization-invite";

export async function inviteTeamMemberAction(input: {
  email: string;
  role: MembershipRole;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const permissions = resolveWorkspacePermissions(workspace.membership.role);

  if (!permissions.canManageMembers) {
    return { ok: false, message: "You do not have permission to invite members." };
  }

  const result = await createOrganizationInvite({
    organizationId: workspace.organization.id,
    organizationName: workspace.organization.name,
    email: input.email,
    role: input.role,
    invitedByUserId: session.user.id,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/settings");
  return { ok: true };
}

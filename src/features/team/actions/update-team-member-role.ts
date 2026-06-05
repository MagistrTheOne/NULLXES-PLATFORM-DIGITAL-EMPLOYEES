"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import type { MembershipRole } from "@/features/workspace/types";
import { updateTeamMemberRole } from "../services/remove-team-member";

export async function updateTeamMemberRoleAction(input: {
  membershipId: string;
  role: MembershipRole;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageMembers) {
    return { ok: false, message: "You do not have permission to change roles." };
  }

  const result = await updateTeamMemberRole({
    organizationId: workspace.organization.id,
    membershipId: input.membershipId,
    role: input.role,
    actorRole: workspace.membership.role,
  });

  if (result.ok) {
    revalidatePath("/settings");
  }

  return result;
}

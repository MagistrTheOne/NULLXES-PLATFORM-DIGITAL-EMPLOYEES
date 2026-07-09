"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { removeTeamMember } from "../services/remove-team-member";

export async function removeTeamMemberAction(
  membershipId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageMembers) {
    return { ok: false, message: "You do not have permission to remove members." };
  }

  const result = await removeTeamMember({
    organizationId: workspace.organization.id,
    membershipId,
    actorUserId: session.user.id,
  });

  if (result.ok) {
    recordAuditEvent({
      organizationId: workspace.organization.id,
      actorUserId: session.user.id,
      actorRole: workspace.membership.role,
      action: "member.removed",
      resourceType: "membership",
      resourceId: membershipId,
    });
    revalidatePath("/settings");
  }

  return result;
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { resendOrganizationInvite } from "../services/resend-organization-invite";

export async function resendTeamInviteAction(
  inviteId: string,
): Promise<
  | { ok: true; emailSent: boolean }
  | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageMembers) {
    return { ok: false, message: "You do not have permission to manage invites." };
  }

  const result = await resendOrganizationInvite({
    organizationId: workspace.organization.id,
    inviteId,
  });

  if (result.ok) {
    revalidatePath("/settings");
  }

  return result;
}

"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { acceptOrganizationInvite } from "../services/accept-organization-invite";

export async function acceptOrganizationInviteAction(
  token: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await requireAuth();
  const result = await acceptOrganizationInvite({
    token,
    userId: session.user.id,
    userEmail: session.user.email,
  });

  if (!result.ok) {
    return result;
  }

  return { ok: true };
}

"use server";

import { acceptOrganizationInvite } from "../services/accept-organization-invite";

export async function acceptInviteForNewUserAction(input: {
  token: string;
  userId: string;
  email: string;
}): Promise<
  { ok: true; organizationId: string } | { ok: false; message: string }
> {
  const result = await acceptOrganizationInvite({
    token: input.token,
    userId: input.userId,
    userEmail: input.email,
  });

  if (!result.ok) {
    return result;
  }

  return { ok: true, organizationId: result.organizationId };
}

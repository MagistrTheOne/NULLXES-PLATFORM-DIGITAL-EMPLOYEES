"use server";

import { acceptOrganizationInvite } from "../services/accept-organization-invite";
import { recordUserConsents } from "@/features/privacy/services/record-user-consent";

/**
 * Used right after sign-up when the session cookie may not be readable yet.
 * Never trust client-supplied email — acceptOrganizationInvite loads email
 * from the user row for `userId`.
 */
export async function acceptInviteForNewUserAction(input: {
  token: string;
  userId: string;
}): Promise<
  { ok: true; organizationId: string } | { ok: false; message: string }
> {
  const result = await acceptOrganizationInvite({
    token: input.token,
    userId: input.userId,
  });

  if (!result.ok) {
    return result;
  }

  await recordUserConsents({
    userId: input.userId,
    organizationId: result.organizationId,
    consentTypes: ["personal_data_processing", "terms_of_service"],
  });

  return { ok: true, organizationId: result.organizationId };
}

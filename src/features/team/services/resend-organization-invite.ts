import { and, eq } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { organizationInvite } from "@/entities/organization-invite/schema";
import { db } from "@/shared/db/client";
import { createInviteToken, hashInviteToken } from "../lib/hash-invite-token";
import { sendInviteEmail } from "../lib/send-invite-email";

export async function resendOrganizationInvite(input: {
  organizationId: string;
  inviteId: string;
}): Promise<{ ok: true; emailSent: boolean } | { ok: false; message: string }> {
  const [invite] = await db
    .select({
      id: organizationInvite.id,
      email: organizationInvite.email,
      role: organizationInvite.role,
      organizationName: organization.name,
    })
    .from(organizationInvite)
    .innerJoin(organization, eq(organization.id, organizationInvite.organizationId))
    .where(
      and(
        eq(organizationInvite.id, input.inviteId),
        eq(organizationInvite.organizationId, input.organizationId),
        eq(organizationInvite.status, "pending"),
      ),
    )
    .limit(1);

  if (!invite) {
    return { ok: false, message: "Invite not found or already handled." };
  }

  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await db
    .update(organizationInvite)
    .set({
      tokenHash: hashInviteToken(token),
      expiresAt,
    })
    .where(eq(organizationInvite.id, invite.id));

  const emailResult = await sendInviteEmail({
    email: invite.email,
    organizationName: invite.organizationName,
    role: invite.role,
    token,
  });

  return { ok: true, emailSent: emailResult.sent };
}

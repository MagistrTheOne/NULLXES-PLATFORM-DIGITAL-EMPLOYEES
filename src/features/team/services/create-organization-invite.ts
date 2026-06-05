import { and, eq } from "drizzle-orm";
import type { MembershipRole } from "@/features/workspace/types";
import { organizationInvite } from "@/entities/organization-invite/schema";
import { db } from "@/shared/db/client";
import { createInviteToken, hashInviteToken } from "../lib/hash-invite-token";
import { sendInviteEmail } from "../lib/send-invite-email";

export async function createOrganizationInvite(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  role: MembershipRole;
  invitedByUserId: string;
}): Promise<{ ok: true; inviteId: string } | { ok: false; message: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const existingPending = await db.query.organizationInvite.findFirst({
    where: and(
      eq(organizationInvite.organizationId, input.organizationId),
      eq(organizationInvite.email, normalizedEmail),
      eq(organizationInvite.status, "pending"),
    ),
  });

  if (existingPending) {
    return { ok: false, message: "An invite is already pending for this email." };
  }

  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const [invite] = await db
    .insert(organizationInvite)
    .values({
      organizationId: input.organizationId,
      email: normalizedEmail,
      role: input.role,
      tokenHash: hashInviteToken(token),
      invitedByUserId: input.invitedByUserId,
      expiresAt,
    })
    .returning({ id: organizationInvite.id });

  if (!invite) {
    return { ok: false, message: "Failed to create invite." };
  }

  await sendInviteEmail({
    email: normalizedEmail,
    organizationName: input.organizationName,
    role: input.role,
    token,
  });

  return { ok: true, inviteId: invite.id };
}

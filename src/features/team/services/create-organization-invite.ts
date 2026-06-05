import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { MembershipRole } from "@/features/workspace/types";
import { organizationInvite } from "@/entities/organization-invite/schema";
import { getResendClient, getResendFromAddress } from "@/shared/email/resend-client";
import { getBetterAuthUrl } from "@/shared/config/env";
import { db } from "@/shared/db/client";

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

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

  const token = randomBytes(32).toString("hex");
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

  const resend = getResendClient();
  if (resend) {
    const acceptUrl = `${getBetterAuthUrl()}/register?invite=${token}`;
    await resend.emails.send({
      from: getResendFromAddress(),
      to: normalizedEmail,
      subject: `Join ${input.organizationName} on NULLXES`,
      html: `<p>You were invited to <strong>${input.organizationName}</strong> as <strong>${input.role}</strong>.</p><p><a href="${acceptUrl}">Accept invite</a></p>`,
    });
  }

  return { ok: true, inviteId: invite.id };
}

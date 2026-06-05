import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { createMembership } from "@/entities/membership/create-membership";
import { membership } from "@/entities/membership/schema";
import { organizationInvite } from "@/entities/organization-invite/schema";
import { db } from "@/shared/db/client";

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function acceptOrganizationInvite(input: {
  token: string;
  userId: string;
  userEmail: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; message: string }> {
  const normalizedEmail = input.userEmail.trim().toLowerCase();
  const tokenHash = hashInviteToken(input.token.trim());

  const invite = await db.query.organizationInvite.findFirst({
    where: and(
      eq(organizationInvite.tokenHash, tokenHash),
      eq(organizationInvite.status, "pending"),
    ),
  });

  if (!invite) {
    return { ok: false, message: "Invite not found or already used." };
  }

  if (invite.expiresAt < new Date()) {
    await db
      .update(organizationInvite)
      .set({ status: "expired" })
      .where(eq(organizationInvite.id, invite.id));
    return { ok: false, message: "This invite has expired." };
  }

  if (invite.email !== normalizedEmail) {
    return {
      ok: false,
      message: "Sign in with the email address that received the invite.",
    };
  }

  const [existing] = await db
    .select({ id: membership.id })
    .from(membership)
    .where(
      and(
        eq(membership.userId, input.userId),
        eq(membership.organizationId, invite.organizationId),
      ),
    )
    .limit(1);

  if (!existing) {
    await createMembership({
      userId: input.userId,
      organizationId: invite.organizationId,
      role: invite.role,
    });
  }

  await db
    .update(organizationInvite)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(organizationInvite.id, invite.id));

  return { ok: true, organizationId: invite.organizationId };
}

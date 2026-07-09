import { and, eq } from "drizzle-orm";
import { createMembership } from "@/entities/membership/create-membership";
import { membership } from "@/entities/membership/schema";
import { organizationInvite } from "@/entities/organization-invite/schema";
import { user } from "@/entities/user/schema";
import { assertCanAddSeat } from "@/features/billing/services/assert-can-add-seat";
import { db } from "@/shared/db/client";
import { hashInviteToken } from "../lib/hash-invite-token";

export async function acceptOrganizationInvite(input: {
  token: string;
  userId: string;
  /** Optional hint only — canonical email is always loaded from the user row. */
  userEmail?: string;
}): Promise<{ ok: true; organizationId: string } | { ok: false; message: string }> {
  const tokenHash = hashInviteToken(input.token.trim());

  const [account] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);

  if (!account?.email) {
    return { ok: false, message: "User account not found." };
  }

  const normalizedEmail = account.email.trim().toLowerCase();

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
    const seatCheck = await assertCanAddSeat({
      organizationId: invite.organizationId,
    });
    if (!seatCheck.ok) {
      return seatCheck;
    }

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

  await db
    .update(user)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(user.id, input.userId));

  return { ok: true, organizationId: invite.organizationId };
}

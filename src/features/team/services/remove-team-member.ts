import { and, count, eq } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { db } from "@/shared/db/client";
import type { MembershipRole } from "@/features/workspace/types";

export async function removeTeamMember(input: {
  organizationId: string;
  membershipId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const [target] = await db
    .select({
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
    })
    .from(membership)
    .where(
      and(
        eq(membership.id, input.membershipId),
        eq(membership.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!target) {
    return { ok: false, message: "Member not found." };
  }

  if (target.userId === input.actorUserId) {
    return { ok: false, message: "You cannot remove yourself from the workspace." };
  }

  if (target.role === "owner") {
    const [ownerCount] = await db
      .select({ total: count() })
      .from(membership)
      .where(
        and(
          eq(membership.organizationId, input.organizationId),
          eq(membership.role, "owner"),
        ),
      );

    if (Number(ownerCount?.total ?? 0) <= 1) {
      return { ok: false, message: "Cannot remove the last workspace owner." };
    }
  }

  await db.delete(membership).where(eq(membership.id, target.id));

  return { ok: true };
}

export async function updateTeamMemberRole(input: {
  organizationId: string;
  membershipId: string;
  role: MembershipRole;
  actorRole: MembershipRole;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (input.role === "owner" && input.actorRole !== "owner") {
    return { ok: false, message: "Only owners can assign the owner role." };
  }

  const [target] = await db
    .select({
      id: membership.id,
      role: membership.role,
    })
    .from(membership)
    .where(
      and(
        eq(membership.id, input.membershipId),
        eq(membership.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!target) {
    return { ok: false, message: "Member not found." };
  }

  if (target.role === "owner" && input.role !== "owner") {
    const [ownerCount] = await db
      .select({ total: count() })
      .from(membership)
      .where(
        and(
          eq(membership.organizationId, input.organizationId),
          eq(membership.role, "owner"),
        ),
      );

    if (Number(ownerCount?.total ?? 0) <= 1) {
      return { ok: false, message: "Cannot change role of the last workspace owner." };
    }
  }

  await db
    .update(membership)
    .set({ role: input.role })
    .where(eq(membership.id, target.id));

  return { ok: true };
}

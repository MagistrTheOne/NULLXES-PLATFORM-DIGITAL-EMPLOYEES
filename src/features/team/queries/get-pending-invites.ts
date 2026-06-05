import { and, asc, eq, gt } from "drizzle-orm";
import { organizationInvite } from "@/entities/organization-invite/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import type { TeamInviteRow } from "@/features/settings/types";

export async function getPendingInvites(
  organizationId: string,
): Promise<TeamInviteRow[]> {
  const rows = await db
    .select({
      id: organizationInvite.id,
      email: organizationInvite.email,
      role: organizationInvite.role,
      status: organizationInvite.status,
      expiresAt: organizationInvite.expiresAt,
      createdAt: organizationInvite.createdAt,
      invitedByName: user.name,
    })
    .from(organizationInvite)
    .innerJoin(user, eq(user.id, organizationInvite.invitedByUserId))
    .where(
      and(
        eq(organizationInvite.organizationId, organizationId),
        eq(organizationInvite.status, "pending"),
        gt(organizationInvite.expiresAt, new Date()),
      ),
    )
    .orderBy(asc(organizationInvite.createdAt));

  return rows;
}

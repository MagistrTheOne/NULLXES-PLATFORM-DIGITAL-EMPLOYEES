import { asc, eq } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import type { TeamMemberRow } from "../types";

export async function getTeamMembers(
  organizationId: string,
): Promise<TeamMemberRow[]> {
  const rows = await db
    .select({
      id: membership.id,
      userId: membership.userId,
      name: user.name,
      email: user.email,
      role: membership.role,
      createdAt: membership.createdAt,
    })
    .from(membership)
    .innerJoin(user, eq(membership.userId, user.id))
    .where(eq(membership.organizationId, organizationId))
    .orderBy(asc(membership.createdAt));

  return rows;
}

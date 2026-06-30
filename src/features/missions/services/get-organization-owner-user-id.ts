import { eq } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { db } from "@/shared/db/client";

export async function getOrganizationOwnerUserId(
  organizationId: string,
): Promise<string | null> {
  const members = await db
    .select({ userId: membership.userId, role: membership.role })
    .from(membership)
    .where(eq(membership.organizationId, organizationId));

  const ownerMembership = members.find((row) => row.role === "owner");
  if (ownerMembership) {
    return ownerMembership.userId;
  }

  const adminMembership = members.find((row) => row.role === "admin");
  if (adminMembership) {
    return adminMembership.userId;
  }

  return members[0]?.userId ?? null;
}

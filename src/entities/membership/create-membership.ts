import { db } from "@/shared/db/client";
import { membership, type membershipRoleEnum } from "./schema";

export type CreateMembershipInput = {
  userId: string;
  organizationId: string;
  role: (typeof membershipRoleEnum.enumValues)[number];
};

export async function createMembership(input: CreateMembershipInput) {
  const [created] = await db
    .insert(membership)
    .values({
      userId: input.userId,
      organizationId: input.organizationId,
      role: input.role,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create membership");
  }

  return created;
}

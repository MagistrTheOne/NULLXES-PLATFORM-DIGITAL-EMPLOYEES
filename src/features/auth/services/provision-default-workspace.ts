"use server";

import { createMembership } from "@/entities/membership/create-membership";
import { createOrganization } from "@/entities/organization/create-organization";

export async function provisionDefaultWorkspace(
  userId: string,
  displayName: string,
): Promise<void> {
  const slugBase = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);

  const org = await createOrganization({
    name: `${displayName}'s Organization`,
    slug: `${slugBase || "workspace"}-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  await createMembership({
    userId,
    organizationId: org.id,
    role: "owner",
  });
}

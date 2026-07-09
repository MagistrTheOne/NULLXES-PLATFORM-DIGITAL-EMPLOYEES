"use server";

import { createMembership } from "@/entities/membership/create-membership";
import { createOrganization } from "@/entities/organization/create-organization";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { recordUserConsents } from "@/features/privacy/services/record-user-consent";

export async function provisionDefaultWorkspace(
  userId: string,
  displayName: string,
): Promise<{ organizationId: string }> {
  const slugBase = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);

  const org = await createOrganization({
    name: `${displayName}'s Organization`,
    slug: `${slugBase || "workspace"}-${Date.now()}`,
    type: "demo",
    status: "active",
  });

  await createMembership({
    userId,
    organizationId: org.id,
    role: "owner",
  });

  await ensureOrganizationSettings(org.id);

  await recordUserConsents({
    userId,
    organizationId: org.id,
    consentTypes: ["personal_data_processing", "terms_of_service"],
  });

  return { organizationId: org.id };
}

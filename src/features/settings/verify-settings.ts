import { eq } from "drizzle-orm";
import { createMembership } from "@/entities/membership/create-membership";
import { createOrganization } from "@/entities/organization/create-organization";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { resolveWorkspace } from "@/features/workspace";
import { updateOrganizationSettings } from "./services/update-organization-settings";
import { getSettingsPageData } from "./services/get-settings-page-data";

const TEST_USER_ID = "settings-verify-user";

async function ensureTestUser(): Promise<void> {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Settings Verify User",
      email: "settings-verify@nullxes.local",
      emailVerified: true,
      status: "active",
    });
  }
}

async function verifySettings(): Promise<void> {
  await ensureTestUser();

  const org = await createOrganization({
    name: "Settings Verify Org",
    slug: `settings-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  await createMembership({
    userId: TEST_USER_ID,
    organizationId: org.id,
    role: "owner",
  });

  const settings = await ensureOrganizationSettings(org.id);

  if (settings.defaultBrainProvider !== "openai") {
    throw new Error("Default brain provider seed mismatch");
  }

  const updateResult = await updateOrganizationSettings({
    organizationId: org.id,
    settings: {
      website: "https://nullxes.com",
      industry: "technology",
      timezone: "Europe/Moscow",
      defaultBrainProvider: "anthropic",
      defaultTimeRangeDays: 14,
      retentionPolicyDays: 180,
    },
  });

  if (!updateResult.ok) {
    throw new Error("Failed to update organization settings");
  }

  const [stored] = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, org.id))
    .limit(1);

  if (stored?.defaultBrainProvider !== "anthropic" || stored.timezone !== "Europe/Moscow") {
    throw new Error("Organization settings were not persisted");
  }

  const workspace = await resolveWorkspace({ userId: TEST_USER_ID });
  const pageData = await getSettingsPageData(workspace);

  if (pageData.settings.defaultBrainProvider !== "anthropic") {
    throw new Error("Settings page data did not reflect updates");
  }

  if (!pageData.canManageOrganization) {
    throw new Error("Owner should be able to manage organization settings");
  }

  console.log("Settings verification passed");
}

verifySettings().catch((error: unknown) => {
  console.error("Settings verification failed", error);
  process.exit(1);
});

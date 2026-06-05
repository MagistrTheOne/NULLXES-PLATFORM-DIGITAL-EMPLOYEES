import { eq } from "drizzle-orm";
import { isMissingRelationError } from "@/shared/errors/is-missing-relation-error";
import { db } from "@/shared/db/client";
import { organizationSettings } from "./schema";

export class OrganizationSettingsTableMissingError extends Error {
  constructor() {
    super(
      "organization_settings table is missing. Run npm run db:migrate to apply pending migrations.",
    );
    this.name = "OrganizationSettingsTableMissingError";
  }
}

export async function ensureOrganizationSettings(
  organizationId: string,
): Promise<typeof organizationSettings.$inferSelect> {
  let existing: typeof organizationSettings.$inferSelect | undefined;

  try {
    [existing] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, organizationId))
      .limit(1);
  } catch (error: unknown) {
    if (isMissingRelationError(error)) {
      throw new OrganizationSettingsTableMissingError();
    }

    throw error;
  }

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(organizationSettings)
    .values({ organizationId })
    .returning();

  if (!created) {
    throw new Error("Failed to create organization settings");
  }

  return created;
}

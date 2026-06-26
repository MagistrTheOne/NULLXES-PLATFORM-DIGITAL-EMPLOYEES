import { eq } from "drizzle-orm";
import {
  isMissingRelationError,
  isPendingOrganizationSettingsMigrationError,
} from "@/shared/errors/is-missing-relation-error";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { organizationSettings } from "./schema";
import {
  organizationSettingsMigrationPendingMessage,
  organizationSettingsTableMissingMessage,
} from "./user-facing-errors";

export class OrganizationSettingsTableMissingError extends Error {
  constructor() {
    super(organizationSettingsTableMissingMessage());
    this.name = "OrganizationSettingsTableMissingError";
  }
}

export class OrganizationSettingsMigrationPendingError extends Error {
  constructor() {
    super(organizationSettingsMigrationPendingMessage());
    this.name = "OrganizationSettingsMigrationPendingError";
  }
}

export async function ensureOrganizationSettings(
  organizationId: string,
): Promise<typeof organizationSettings.$inferSelect> {
  return withDatabaseRetry(() => loadOrCreateOrganizationSettings(organizationId));
}

async function loadOrCreateOrganizationSettings(
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

    if (isPendingOrganizationSettingsMigrationError(error)) {
      throw new OrganizationSettingsMigrationPendingError();
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

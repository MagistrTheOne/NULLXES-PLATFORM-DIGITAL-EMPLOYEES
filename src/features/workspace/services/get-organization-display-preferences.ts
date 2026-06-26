import { ensureOrganizationSettings } from "@/entities/organization-settings";
import {
  OrganizationSettingsMigrationPendingError,
  OrganizationSettingsTableMissingError,
} from "@/entities/organization-settings/ensure-organization-settings";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";
import type { OrganizationDisplayPreferences } from "../types/display-preferences";
import { DEFAULT_ORGANIZATION_DISPLAY_PREFERENCES } from "../types/display-preferences";

export async function getOrganizationDisplayPreferences(
  organizationId: string,
): Promise<OrganizationDisplayPreferences> {
  try {
    const settings = await ensureOrganizationSettings(organizationId);

    return {
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
      language: settings.language,
    };
  } catch (error: unknown) {
    if (
      error instanceof OrganizationSettingsTableMissingError ||
      error instanceof OrganizationSettingsMigrationPendingError ||
      isTransientDatabaseError(error)
    ) {
      return DEFAULT_ORGANIZATION_DISPLAY_PREFERENCES;
    }

    throw error;
  }
}

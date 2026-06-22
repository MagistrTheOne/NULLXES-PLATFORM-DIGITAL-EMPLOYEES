import { isDevelopmentRuntime } from "@/shared/config/env";

export function organizationSettingsTableMissingMessage(): string {
  if (isDevelopmentRuntime()) {
    return "Organization settings are unavailable because pending database migrations have not been applied yet.";
  }

  return "Organization settings are unavailable. Contact your administrator.";
}

export function organizationSettingsMigrationPendingMessage(): string {
  if (isDevelopmentRuntime()) {
    return "Organization settings are out of date. Apply pending database migrations, then reload this page.";
  }

  return "Organization settings need to be updated. Contact your administrator.";
}

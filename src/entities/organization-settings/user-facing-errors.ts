import { isDevelopmentRuntime } from "@/shared/config/env";

export function organizationSettingsTableMissingMessage(): string {
  if (isDevelopmentRuntime()) {
    return "organization_settings table is missing. Run npm run db:migrate to apply pending migrations.";
  }

  return "Organization settings are unavailable. Contact your administrator.";
}

export function organizationSettingsMigrationPendingMessage(): string {
  if (isDevelopmentRuntime()) {
    return "organization_settings schema is out of date. Run npm run db:migrate, then restart npm run dev.";
  }

  return "Organization settings need to be updated. Contact your administrator.";
}

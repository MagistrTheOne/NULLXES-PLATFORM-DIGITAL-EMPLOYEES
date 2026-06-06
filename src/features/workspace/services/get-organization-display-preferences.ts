import { ensureOrganizationSettings } from "@/entities/organization-settings";
import type { OrganizationDisplayPreferences } from "../types/display-preferences";

export async function getOrganizationDisplayPreferences(
  organizationId: string,
): Promise<OrganizationDisplayPreferences> {
  const settings = await ensureOrganizationSettings(organizationId);

  return {
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    language: settings.language,
  };
}

import { SettingsGeneralTab } from "./SettingsGeneralTab";
import type { OrganizationProfileDto, OrganizationSettingsDto } from "../types";

export function SettingsOrganizationTab({
  organization,
  settings,
  canManageOrganization,
}: {
  organization: OrganizationProfileDto;
  settings: OrganizationSettingsDto;
  canManageOrganization: boolean;
}) {
  return (
    <SettingsGeneralTab
      organization={organization}
      settings={settings}
      canManageOrganization={canManageOrganization}
      sections={["profile"]}
    />
  );
}

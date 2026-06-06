export type OrganizationDisplayPreferences = {
  dateFormat: string;
  timeFormat: string;
  language: string;
};

export const DEFAULT_ORGANIZATION_DISPLAY_PREFERENCES: OrganizationDisplayPreferences =
  {
    dateFormat: "MMM d, yyyy",
    timeFormat: "24h",
    language: "en",
  };

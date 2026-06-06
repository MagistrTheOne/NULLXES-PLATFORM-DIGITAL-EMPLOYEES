"use client";

import { createContext, useContext } from "react";
import {
  formatOrganizationDate,
  formatOrganizationDateTime,
} from "@/shared/i18n/format-organization-date";
import type { OrganizationDisplayPreferences } from "../types/display-preferences";

const WorkspaceDisplayPreferencesContext =
  createContext<OrganizationDisplayPreferences | null>(null);

export function WorkspaceDisplayPreferencesProvider({
  preferences,
  children,
}: {
  preferences: OrganizationDisplayPreferences;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceDisplayPreferencesContext.Provider value={preferences}>
      {children}
    </WorkspaceDisplayPreferencesContext.Provider>
  );
}

export function useWorkspaceDisplayPreferences(): OrganizationDisplayPreferences {
  const preferences = useContext(WorkspaceDisplayPreferencesContext);

  if (!preferences) {
    return {
      dateFormat: "MMM d, yyyy",
      timeFormat: "24h",
      language: "en",
    };
  }

  return preferences;
}

export function useFormatOrganizationDate() {
  const preferences = useWorkspaceDisplayPreferences();

  return {
    formatDate: (date: Date | string | number) =>
      formatOrganizationDate(date, {
        dateFormat: preferences.dateFormat,
        locale: preferences.language,
      }),
    formatDateTime: (date: Date | string | number) =>
      formatOrganizationDateTime(date, {
        dateFormat: preferences.dateFormat,
        timeFormat: preferences.timeFormat,
        locale: preferences.language,
      }),
    preferences,
  };
}

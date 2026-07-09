/**
 * Settings information architecture.
 * Deep links keep legacy `?tab=` ids; primary nav is human-facing groups.
 */

export const SETTINGS_TAB_IDS = [
  "general",
  "organization",
  "team",
  "billing",
  "integrations",
  "security",
  "audit",
  "ai",
  "characters",
  "skills",
  "tools",
  "notifications",
  "advanced",
] as const;

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];

export type SettingsNavGroupId =
  | "workspace"
  | "people"
  | "plan"
  | "security"
  | "more";

export const SETTINGS_PRIMARY_GROUPS: Array<{
  id: SettingsNavGroupId;
  /** Default tab when the group is selected (for groups with one surface). */
  defaultTab: SettingsTabId;
  /** Tabs that belong to this group (for active-state resolution). */
  tabs: SettingsTabId[];
}> = [
  {
    id: "workspace",
    defaultTab: "general",
    tabs: ["general", "organization"],
  },
  {
    id: "people",
    defaultTab: "team",
    tabs: ["team"],
  },
  {
    id: "plan",
    defaultTab: "billing",
    tabs: ["billing"],
  },
  {
    id: "security",
    defaultTab: "security",
    tabs: ["security"],
  },
  {
    id: "more",
    defaultTab: "integrations",
    tabs: [
      "integrations",
      "audit",
      "ai",
      "characters",
      "skills",
      "tools",
      "notifications",
      "advanced",
    ],
  },
];

export const SETTINGS_MORE_TABS: SettingsTabId[] = [
  "integrations",
  "ai",
  "characters",
  "skills",
  "tools",
  "notifications",
  "audit",
  "advanced",
];

export function resolveSettingsTab(tab: string | null): SettingsTabId {
  if (tab === "organization") {
    return "general";
  }
  if (tab && SETTINGS_TAB_IDS.includes(tab as SettingsTabId)) {
    return tab as SettingsTabId;
  }
  return "general";
}

export function resolveNavGroupForTab(tab: SettingsTabId): SettingsNavGroupId {
  for (const group of SETTINGS_PRIMARY_GROUPS) {
    if (group.tabs.includes(tab)) {
      return group.id;
    }
  }
  return "workspace";
}

export function isMoreTab(tab: SettingsTabId): boolean {
  return SETTINGS_MORE_TABS.includes(tab);
}

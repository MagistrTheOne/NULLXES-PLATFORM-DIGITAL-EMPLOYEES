"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateDataPrivacySettingsAction } from "../actions/update-data-privacy-settings";
import { updateDefaultEmployeeSettingsAction } from "../actions/update-default-employee-settings";
import { updateOrganizationPreferencesAction } from "../actions/update-organization-preferences";
import { updateOrganizationProfileAction } from "../actions/update-organization-profile";
import { BRAIN_PROVIDER_OPTIONS } from "../lib/brain-provider-labels";
import {
  DATE_FORMAT_OPTIONS,
  INDUSTRY_OPTIONS,
  KNOWLEDGE_PROCESSING_OPTIONS,
  LANGUAGE_OPTIONS,
  RETENTION_OPTIONS,
  TIME_FORMAT_OPTIONS,
  TIME_RANGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../lib/options";
import type { BrainProvider } from "@/entities/digital-employee";
import type { OrganizationProfileDto, OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

type SettingsSection = "profile" | "preferences" | "defaults" | "privacy";

export function SettingsGeneralTab({
  organization,
  settings,
  canManageOrganization,
  sections = ["profile", "preferences", "defaults", "privacy"],
}: {
  organization: OrganizationProfileDto;
  settings: OrganizationSettingsDto;
  canManageOrganization: boolean;
  sections?: SettingsSection[];
}) {
  const show = (section: SettingsSection) => sections.includes(section);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [profile, setProfile] = useState({
    name: organization.name,
    website: settings.website ?? "",
    industry: settings.industry,
    timezone: settings.timezone,
  });

  const [preferences, setPreferences] = useState({
    theme: settings.theme,
    language: settings.language,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    defaultTimeRangeDays: settings.defaultTimeRangeDays,
    compactMode: settings.compactMode,
  });

  const [defaults, setDefaults] = useState({
    defaultBrainProvider: settings.defaultBrainProvider,
    knowledgeProcessing: settings.knowledgeProcessing,
    sessionRetentionDays: settings.sessionRetentionDays,
  });

  const [privacy, setPrivacy] = useState({
    retentionPolicyDays: settings.retentionPolicyDays,
  });

  function runAction(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? "Settings saved." : result.message ?? "Save failed.");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? (
        <p className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {show("profile") ? (
        <SettingsCard
          title="Organization Profile"
          description="Workspace identity and regional defaults"
          footer={
            <Button
              type="button"
              disabled={!canManageOrganization || isPending}
              onClick={() =>
                runAction(() => updateOrganizationProfileAction(profile))
              }
            >
              Save Changes
            </Button>
          }
        >
          <div className="grid gap-4">
            <Field label="Organization Name">
              <Input
                value={profile.name}
                disabled={!canManageOrganization}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Industry">
              <Select
                value={profile.industry}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setProfile((current) => ({ ...current, industry: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Website">
              <Input
                value={profile.website}
                disabled={!canManageOrganization}
                placeholder="https://nullxes.com"
                onChange={(event) =>
                  setProfile((current) => ({ ...current, website: event.target.value }))
                }
              />
            </Field>
            <Field label="Timezone">
              <Select
                value={profile.timezone}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setProfile((current) => ({ ...current, timezone: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SettingsCard>
        ) : null}

        {show("preferences") ? (
        <SettingsCard
          title="Preferences"
          description="Platform display and analytics defaults"
          footer={
            <Button
              type="button"
              disabled={!canManageOrganization || isPending}
              onClick={() =>
                runAction(() => updateOrganizationPreferencesAction(preferences))
              }
            >
              Save Changes
            </Button>
          }
        >
          <div className="grid gap-4">
            <Field label="Theme">
              <Select value={preferences.theme} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Language">
              <p className="text-xs text-muted-foreground">
                Uses next-intl. Settings UI translates first; other screens follow gradually.
              </p>
              <Select
                value={preferences.language}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setPreferences((current) => ({ ...current, language: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date Format">
              <Select
                value={preferences.dateFormat}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setPreferences((current) => ({ ...current, dateFormat: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Time Format">
              <Select
                value={preferences.timeFormat}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setPreferences((current) => ({ ...current, timeFormat: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Default Time Range">
              <Select
                value={String(preferences.defaultTimeRangeDays)}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setPreferences((current) => ({
                    ...current,
                    defaultTimeRangeDays: Number(value),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3">
              <div>
                <p className="text-sm text-foreground">Compact Mode</p>
                <p className="text-xs text-muted-foreground">
                  Tighter spacing across dashboard surfaces
                </p>
              </div>
              <Switch
                checked={preferences.compactMode}
                disabled={!canManageOrganization}
                onCheckedChange={(checked) =>
                  setPreferences((current) => ({ ...current, compactMode: checked }))
                }
              />
            </div>
          </div>
        </SettingsCard>
        ) : null}

        {show("defaults") ? (
        <SettingsCard
          title="Default Employee Settings"
          description="Defaults applied when creating new digital employees"
          footer={
            <Button
              type="button"
              disabled={!canManageOrganization || isPending}
              onClick={() =>
                runAction(() => updateDefaultEmployeeSettingsAction(defaults))
              }
            >
              Save Changes
            </Button>
          }
        >
          <div className="grid gap-4">
            <Field label="Default LLM">
              <Select
                value={defaults.defaultBrainProvider}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setDefaults((current) => ({
                    ...current,
                    defaultBrainProvider: value as BrainProvider,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAIN_PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Knowledge Processing">
              <Select
                value={defaults.knowledgeProcessing}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setDefaults((current) => ({
                    ...current,
                    knowledgeProcessing: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_PROCESSING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Session Retention">
              <Select
                value={String(defaults.sessionRetentionDays)}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setDefaults((current) => ({
                    ...current,
                    sessionRetentionDays: Number(value),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SettingsCard>
        ) : null}

        {show("privacy") ? (
        <SettingsCard
          title="Data & Privacy"
          description="Retention and export controls"
          footer={
            <Button
              type="button"
              disabled={!canManageOrganization || isPending}
              onClick={() =>
                runAction(() => updateDataPrivacySettingsAction(privacy))
              }
            >
              Save Changes
            </Button>
          }
        >
          <div className="grid gap-4">
            <Field label="Retention Policy">
              <Select
                value={String(privacy.retentionPolicyDays)}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setPrivacy({ retentionPolicyDays: Number(value) })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <StatusRow label="Data Export" value="Available on request" />
            <StatusRow label="Delete Sessions" value="Managed by retention policy" />
            <StatusRow label="Anonymize Data" value="Contact administrator" />
          </div>
        </SettingsCard>
        ) : null}
      </div>
    </div>
  );
}

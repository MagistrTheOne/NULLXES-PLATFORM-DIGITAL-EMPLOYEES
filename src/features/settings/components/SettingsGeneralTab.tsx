"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
import { DefaultBrainModelField } from "./DefaultBrainModelField";
import { updateOrganizationPreferencesAction } from "../actions/update-organization-preferences";
import { updateOrganizationProfileAction } from "../actions/update-organization-profile";
import { BRAIN_PROVIDER_OPTIONS } from "../lib/brain-provider-labels";
import { optionLabel } from "../lib/translated-option-label";
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
  const t = useTranslations("settings.general");
  const tSettings = useTranslations("settings");
  const tOptions = useTranslations("settings.options");
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
    defaultBrainModel: settings.defaultBrainModel,
    knowledgeProcessing: settings.knowledgeProcessing,
    sessionRetentionDays: settings.sessionRetentionDays,
  });

  const [privacy, setPrivacy] = useState({
    retentionPolicyDays: settings.retentionPolicyDays,
  });

  function runAction(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(
        result.ok ? tSettings("saved") : result.message ?? tSettings("saveFailed"),
      );
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
          title={t("organizationProfile")}
          description={t("organizationProfileDesc")}
          footer={
            <Button
              type="button"
              disabled={!canManageOrganization || isPending}
              onClick={() =>
                runAction(() => updateOrganizationProfileAction(profile))
              }
            >
              {tSettings("saveChanges")}
            </Button>
          }
        >
          <div className="grid gap-4">
            <Field label={t("organizationName")}>
              <Input
                value={profile.name}
                disabled={!canManageOrganization}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label={t("industry")}>
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
                      {optionLabel(tOptions, option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("website")}>
              <Input
                value={profile.website}
                disabled={!canManageOrganization}
                placeholder="https://nullxes.com"
                onChange={(event) =>
                  setProfile((current) => ({ ...current, website: event.target.value }))
                }
              />
            </Field>
            <Field label={t("timezone")}>
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
                      {optionLabel(tOptions, option.labelKey)}
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
          title={t("preferences")}
          description={t("preferencesDesc")}
          footer={
            <Button
              type="button"
              disabled={!canManageOrganization || isPending}
              onClick={() =>
                runAction(() => updateOrganizationPreferencesAction(preferences))
              }
            >
              {tSettings("saveChanges")}
            </Button>
          }
        >
          <div className="grid gap-4">
            <Field label={t("theme")}>
              <Select value={preferences.theme} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">{t("themeDark")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("language")}>
              <p className="text-xs text-muted-foreground">{t("languageHint")}</p>
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
                      {optionLabel(tOptions, option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("dateFormat")}>
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
                      {optionLabel(tOptions, option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("timeFormat")}>
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
                      {optionLabel(tOptions, option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("defaultTimeRange")}>
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
                      {optionLabel(tOptions, option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3">
              <div>
                <p className="text-sm text-foreground">{t("compactMode")}</p>
                <p className="text-xs text-muted-foreground">{t("compactModeDesc")}</p>
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
          title={t("defaultEmployee")}
          description={t("defaultEmployeeDesc")}
          footer={
            <Button
              type="button"
              disabled={!canManageOrganization || isPending}
              onClick={() =>
                runAction(() => updateDefaultEmployeeSettingsAction(defaults))
              }
            >
              {tSettings("saveChanges")}
            </Button>
          }
        >
          <div className="grid gap-4">
            <Field label={t("defaultLlm")}>
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
                      {optionLabel(tOptions, option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {defaults.defaultBrainProvider === "openai" ? (
              <DefaultBrainModelField
                value={defaults.defaultBrainModel}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setDefaults((current) => ({
                    ...current,
                    defaultBrainModel: value,
                  }))
                }
              />
            ) : null}
            <Field label={t("knowledgeProcessing")}>
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
                      {optionLabel(tOptions, option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("sessionRetention")}>
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
                      {optionLabel(tOptions, option.labelKey)}
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
          title={t("dataPrivacy")}
          description={t("dataPrivacyDesc")}
          footer={
            <Button
              type="button"
              disabled={!canManageOrganization || isPending}
              onClick={() =>
                runAction(() => updateDataPrivacySettingsAction(privacy))
              }
            >
              {tSettings("saveChanges")}
            </Button>
          }
        >
          <div className="grid gap-4">
            <Field label={t("retentionPolicy")}>
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
                      {optionLabel(tOptions, option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <StatusRow label={t("dataExport")} value={t("dataExportValue")} />
            <StatusRow label={t("deleteSessions")} value={t("deleteSessionsValue")} />
            <StatusRow label={t("anonymizeData")} value={t("anonymizeDataValue")} />
          </div>
        </SettingsCard>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDateFormatPreview, getOrganizationDateFormat } from "@/shared/i18n/format-organization-date";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import type { OrganizationProfileDto, OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";
import { SettingsPersonalDataCard } from "./SettingsPersonalDataCard";

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm last:border-b-0">
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
  const locale = useLocale();
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
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
      {message ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground backdrop-blur-xl md:col-span-2 xl:col-span-3">
          {message}
        </p>
      ) : null}

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
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="org-name">{t("organizationName")}</FieldLabel>
              <Input
                id="org-name"
                value={profile.name}
                disabled={!canManageOrganization}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>{t("industry")}</FieldLabel>
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
            <Field>
              <FieldLabel htmlFor="org-website">{t("website")}</FieldLabel>
              <Input
                id="org-website"
                value={profile.website}
                disabled={!canManageOrganization}
                placeholder="https://nullxes.com"
                onChange={(event) =>
                  setProfile((current) => ({ ...current, website: event.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>{t("timezone")}</FieldLabel>
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
          </FieldGroup>
        </SettingsCard>
      ) : null}

      {show("preferences") ? (
        <SettingsCard
          title={t("preferences")}
          description={t("preferencesDesc")}
          className="md:col-span-2 xl:col-span-2"
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-foreground">{t("theme")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("themeDarkOnly")}
              </p>
            </div>

            <Field className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <FieldLabel>{t("language")}</FieldLabel>
              <Select
                value={preferences.language}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setPreferences((current) => ({ ...current, language: value }))
                }
              >
                <SelectTrigger className="mt-2 w-full">
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

            <Field className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <FieldLabel>{t("dateFormat")}</FieldLabel>
              <Select
                value={preferences.dateFormat}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setPreferences((current) => ({ ...current, dateFormat: value }))
                }
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {formatDateFormatPreview(option.value, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription className="mt-2">
                {t("dateFormatPreview", {
                  example: formatDateFormatPreview(
                    getOrganizationDateFormat(preferences.dateFormat),
                    locale,
                  ),
                })}
              </FieldDescription>
            </Field>

            <Field className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <FieldLabel>{t("timeFormat")}</FieldLabel>
              <Select
                value={preferences.timeFormat}
                disabled={!canManageOrganization}
                onValueChange={(value) =>
                  setPreferences((current) => ({ ...current, timeFormat: value }))
                }
              >
                <SelectTrigger className="mt-2 w-full">
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

            <Field className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <FieldLabel>{t("defaultTimeRange")}</FieldLabel>
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
                <SelectTrigger className="mt-2 w-full">
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

            <Field
              orientation="horizontal"
              className="items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
            >
              <FieldContent>
                <FieldLabel className="text-foreground">{t("compactMode")}</FieldLabel>
                <FieldDescription>{t("compactModeDesc")}</FieldDescription>
              </FieldContent>
              <Switch
                checked={preferences.compactMode}
                disabled={!canManageOrganization}
                onCheckedChange={(checked) =>
                  setPreferences((current) => ({ ...current, compactMode: checked }))
                }
              />
            </Field>
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
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>{t("knowledgeProcessing")}</FieldLabel>
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
            <Field>
              <FieldLabel>{t("sessionRetention")}</FieldLabel>
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
          </FieldGroup>
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
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>{t("retentionPolicy")}</FieldLabel>
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
            <div className="grid gap-1">
              <Link
                href="/settings?tab=advanced"
                className="flex items-center justify-between gap-4 rounded-lg px-1 py-2.5 text-sm transition-colors hover:bg-white/5"
              >
                <span className="text-muted-foreground">{t("dataExport")}</span>
                <span className="text-foreground underline underline-offset-4">
                  {t("dataExportAction")}
                </span>
              </Link>
              <Link
                href="/settings?tab=general"
                className="flex items-center justify-between gap-4 rounded-lg px-1 py-2.5 text-sm transition-colors hover:bg-white/5"
              >
                <span className="text-muted-foreground">{t("personalData")}</span>
                <span className="text-foreground underline underline-offset-4">
                  {t("personalDataAction")}
                </span>
              </Link>
            </div>
            <div>
              <StatusRow
                label={t("deleteSessions")}
                value={t("deleteSessionsValue")}
              />
              <StatusRow
                label={t("lastRetentionRun")}
                value={
                  settings.lastRetentionRunAt
                    ? new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(settings.lastRetentionRunAt))
                    : t("lastRetentionNever")
                }
              />
            </div>
          </FieldGroup>
        </SettingsCard>
      ) : null}

      <div className="md:col-span-2 xl:col-span-1">
        <SettingsPersonalDataCard />
      </div>
    </div>
  );
}

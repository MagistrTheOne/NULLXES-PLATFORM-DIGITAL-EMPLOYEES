"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { BrainProvider } from "@/entities/digital-employee";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  BrainModelSelect,
  BrainProviderCards,
  updateBrainSettingsAction,
} from "@/features/brain";
import type { BrainProviderReadinessMap } from "@/features/brain";
import { getDefaultBrainModelForProvider } from "../lib/brain-model-defaults";
import type { OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsAiTab({
  settings,
  canManageOrganization,
  providerReadiness,
}: {
  settings: OrganizationSettingsDto;
  canManageOrganization: boolean;
  providerReadiness: BrainProviderReadinessMap;
}) {
  const t = useTranslations("settings.ai");
  const tSettings = useTranslations("settings");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [brainSettings, setBrainSettings] = useState({
    defaultBrainProvider: settings.defaultBrainProvider,
    defaultBrainModel: settings.defaultBrainModel,
  });

  function runSave() {
    startTransition(async () => {
      const result = await updateBrainSettingsAction(brainSettings);
      setMessage(
        result.ok ? tSettings("saved") : result.message ?? tSettings("saveFailed"),
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title={t("title")}
        description={t("description")}
        footer={
          <Button
            type="button"
            disabled={!canManageOrganization || isPending}
            onClick={runSave}
          >
            {tSettings("saveChanges")}
          </Button>
        }
      >
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">{t("defaultProvider")}</Label>
            <BrainProviderCards
              variant="settings"
              selectedProvider={brainSettings.defaultBrainProvider}
              providerReadiness={providerReadiness}
              disabled={!canManageOrganization}
              onProviderChange={(provider: BrainProvider) => {
                setBrainSettings((current) => ({
                  ...current,
                  defaultBrainProvider: provider,
                  defaultBrainModel: getDefaultBrainModelForProvider(provider),
                }));
              }}
            />
          </div>

          <BrainModelSelect
            variant="settings"
            provider={brainSettings.defaultBrainProvider}
            value={brainSettings.defaultBrainModel}
            disabled={!canManageOrganization}
            label={t("defaultModel")}
            onValueChange={(value) =>
              setBrainSettings((current) => ({
                ...current,
                defaultBrainModel: value,
              }))
            }
          />

          <p className="text-sm text-muted-foreground">{t("perEmployeeNote")}</p>
          <p className="text-sm text-muted-foreground">
            {t("integrationsNote")}{" "}
            <Link href="/settings" className="text-foreground underline underline-offset-4">
              {t("integrationsLink")}
            </Link>
          </p>
          {message ? (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          ) : null}
        </div>
      </SettingsCard>
    </div>
  );
}

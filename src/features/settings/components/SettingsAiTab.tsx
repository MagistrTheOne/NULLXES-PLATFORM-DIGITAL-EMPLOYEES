"use client";

import { useTranslations } from "next-intl";
import type { BrainProvider } from "@/entities/digital-employee";
import type { OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

const BRAIN_OPTION_KEYS: Record<
  BrainProvider,
  "brainOpenai" | "brainAnthropic" | "brainGoogle" | "brainNullxes"
> = {
  openai: "brainOpenai",
  anthropic: "brainAnthropic",
  google: "brainGoogle",
  nullxes: "brainNullxes",
};

export function SettingsAiTab({
  settings,
}: {
  settings: OrganizationSettingsDto;
}) {
  const t = useTranslations("settings.ai");
  const tOptions = useTranslations("settings.options");

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3">
          <span className="text-muted-foreground">{t("defaultLlm")}</span>
          <span className="text-foreground">
            {tOptions(BRAIN_OPTION_KEYS[settings.defaultBrainProvider])}
          </span>
        </div>
        <p className="text-muted-foreground">{t("perEmployeeNote")}</p>
        <p className="text-muted-foreground">{t("generalNote")}</p>
      </div>
    </SettingsCard>
  );
}

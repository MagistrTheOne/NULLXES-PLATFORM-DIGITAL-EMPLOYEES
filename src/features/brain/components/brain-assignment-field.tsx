"use client";

import { useTranslations } from "next-intl";
import type { BrainProvider } from "@/entities/digital-employee";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { BrainProviderReadinessMap } from "../lib/brain-provider-readiness";
import { BrainModelSelect } from "./brain-model-select";
import { BrainProviderCards } from "./brain-provider-cards";

export type BrainAssignmentMode = "org_default" | "custom";

const PROVIDER_OPTION_KEYS: Record<
  BrainProvider,
  "brainOpenai" | "brainAnthropic" | "brainGoogle" | "brainNullxes"
> = {
  openai: "brainOpenai",
  anthropic: "brainAnthropic",
  google: "brainGoogle",
  nullxes: "brainNullxes",
};

export function BrainAssignmentField({
  mode,
  orgDefaultProvider,
  orgDefaultModel,
  customProvider,
  customModel,
  providerReadiness,
  disabled,
  onModeChange,
  onCustomProviderChange,
  onCustomModelChange,
}: {
  mode: BrainAssignmentMode;
  orgDefaultProvider: BrainProvider;
  orgDefaultModel: string;
  customProvider: BrainProvider;
  customModel: string;
  providerReadiness: BrainProviderReadinessMap;
  disabled?: boolean;
  onModeChange: (mode: BrainAssignmentMode) => void;
  onCustomProviderChange: (provider: BrainProvider) => void;
  onCustomModelChange: (model: string) => void;
}) {
  const t = useTranslations("employees.studio.brain");
  const tOptions = useTranslations("settings.options");

  return (
    <RadioGroup
      value={mode}
      onValueChange={(value) => onModeChange(value as BrainAssignmentMode)}
      className="flex flex-col gap-3"
    >
      <div
        className={cn(
          "rounded-xl border transition-colors",
          mode === "org_default"
            ? "border-white/30 bg-white/6"
            : "border-white/10 bg-[#111111]",
        )}
      >
        <label className="flex cursor-pointer items-start gap-3 p-4">
          <RadioGroupItem value="org_default" disabled={disabled} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">{t("useOrgDefault")}</p>
            <p className="mt-1 text-xs text-white/55">
              {tOptions(PROVIDER_OPTION_KEYS[orgDefaultProvider])} · {orgDefaultModel}
            </p>
          </div>
        </label>
      </div>

      <div
        className={cn(
          "rounded-xl border transition-colors",
          mode === "custom"
            ? "border-white/30 bg-white/6"
            : "border-white/10 bg-[#111111]",
        )}
      >
        <label className="flex cursor-pointer items-start gap-3 p-4">
          <RadioGroupItem value="custom" disabled={disabled} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">{t("customModel")}</p>
            <p className="mt-1 text-xs text-white/55">{t("customModelDescription")}</p>
          </div>
        </label>

        {mode === "custom" ? (
          <div className="space-y-4 border-t border-white/10 px-4 pb-4 pt-3">
            <div className="space-y-2">
              <Label className="text-white/80">{t("provider")}</Label>
              <BrainProviderCards
                variant="wizard"
                selectedProvider={customProvider}
                providerReadiness={providerReadiness}
                disabled={disabled}
                onProviderChange={onCustomProviderChange}
              />
            </div>
            <BrainModelSelect
              variant="wizard"
              provider={customProvider}
              value={customModel}
              disabled={disabled}
              label={t("model")}
              onValueChange={onCustomModelChange}
            />
          </div>
        ) : null}
      </div>
    </RadioGroup>
  );
}

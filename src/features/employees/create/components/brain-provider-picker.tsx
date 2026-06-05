"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CUSTOM_BRAIN_PROVIDER_OPTIONS, DEFAULT_BRAIN_PROVIDER } from "../constants";
import type { BrainProvider } from "@/entities/digital-employee";

export function BrainProviderPicker({
  brainProvider,
  customModeEnabled,
  onBrainProviderChange,
  onCustomModeChange,
}: {
  brainProvider: BrainProvider;
  customModeEnabled: boolean;
  onBrainProviderChange: (provider: BrainProvider) => void;
  onCustomModeChange: (enabled: boolean) => void;
}) {
  const t = useTranslations("employees.studio.brain");
  const openAiSelected =
    !customModeEnabled && brainProvider === DEFAULT_BRAIN_PROVIDER;

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => {
          onCustomModeChange(false);
          onBrainProviderChange(DEFAULT_BRAIN_PROVIDER);
        }}
        className={cn(
          "rounded-xl border p-5 text-left transition-colors",
          openAiSelected
            ? "border-white/30 bg-white/6"
            : "border-white/10 bg-[#111111] hover:border-white/20",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/45">
              {t("recommended")}
            </p>
            <h3 className="mt-1 text-base font-medium text-white">{t("openAi")}</h3>
            <p className="mt-2 text-sm text-white/55">{t("openAiDescription")}</p>
          </div>
          <span className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/70">
            {t("active")}
          </span>
        </div>
      </button>

      <Collapsible open={customModeEnabled} onOpenChange={onCustomModeChange}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-between px-0 text-sm text-white/60 hover:bg-transparent hover:text-white"
          >
            {t("customProviders")}
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                customModeEnabled ? "rotate-180" : "",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-2 pt-2">
          <p className="text-xs text-white/45">
            Additional providers will be available in a later release. OpenAI remains
            the supported option for now.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {CUSTOM_BRAIN_PROVIDER_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 opacity-60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-white/80">{option.label}</span>
                  <span className="text-xs text-white/40">Coming soon</span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

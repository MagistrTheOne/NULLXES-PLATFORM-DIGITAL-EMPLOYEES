"use client";

import { useTranslations } from "next-intl";
import type { BrainProvider } from "@/entities/digital-employee";
import { cn } from "@/lib/utils";
import { BRAIN_PROVIDERS } from "../lib/brain-model-catalog";
import type { BrainProviderReadinessMap } from "../lib/brain-provider-readiness";
import { isBrainProviderSelectable } from "../lib/brain-provider-readiness";

const PROVIDER_LABEL_KEYS: Record<
  BrainProvider,
  "openAi" | "anthropic" | "google" | "nullxes"
> = {
  openai: "openAi",
  anthropic: "anthropic",
  google: "google",
  nullxes: "nullxes",
};

const PROVIDER_DESCRIPTION_KEYS: Record<
  BrainProvider,
  "openAiDescription" | "anthropicDescription" | "googleDescription" | "nullxesDescription"
> = {
  openai: "openAiDescription",
  anthropic: "anthropicDescription",
  google: "googleDescription",
  nullxes: "nullxesDescription",
};

const READINESS_BADGE_KEYS: Record<
  "ready" | "configure" | "managed",
  "badgeReady" | "badgeConfigure" | "badgeManaged"
> = {
  ready: "badgeReady",
  configure: "badgeConfigure",
  managed: "badgeManaged",
};

export function BrainProviderCards({
  selectedProvider,
  providerReadiness,
  disabled,
  variant = "settings",
  onProviderChange,
}: {
  selectedProvider: BrainProvider;
  providerReadiness: BrainProviderReadinessMap;
  disabled?: boolean;
  variant?: "settings" | "wizard";
  onProviderChange: (provider: BrainProvider) => void;
}) {
  const t = useTranslations(
    variant === "wizard" ? "employees.studio.brain" : "settings.ai",
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BRAIN_PROVIDERS.map((provider) => {
        const readiness = providerReadiness[provider];
        const selectable = isBrainProviderSelectable(provider, readiness);
        const selected = selectedProvider === provider;

        return (
          <button
            key={provider}
            type="button"
            disabled={disabled || !selectable}
            onClick={() => onProviderChange(provider)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              variant === "wizard"
                ? selected
                  ? "border-white/30 bg-white/6"
                  : "border-white/10 bg-[#111111] hover:border-white/20"
                : selected
                  ? "border-foreground/30 bg-background/60"
                  : "border-border bg-background/40 hover:border-foreground/20",
              !selectable && "cursor-not-allowed opacity-50",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t(PROVIDER_LABEL_KEYS[provider])}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    variant === "wizard" ? "text-white/55" : "text-muted-foreground",
                  )}
                >
                  {t(PROVIDER_DESCRIPTION_KEYS[provider])}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-xs",
                  variant === "wizard"
                    ? "border-white/20 text-white/70"
                    : "border-border text-muted-foreground",
                )}
              >
                {t(READINESS_BADGE_KEYS[readiness])}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

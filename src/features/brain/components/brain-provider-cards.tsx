"use client";

import { useTranslations } from "next-intl";
import type { BrainProvider } from "@/entities/digital-employee";
import { cn } from "@/lib/utils";
import { BRAIN_PROVIDERS } from "../lib/brain-model-catalog";
import type { BrainProviderReadinessMap } from "../lib/brain-provider-readiness";
import { isBrainProviderSelectable } from "../lib/brain-provider-readiness";

const PROVIDER_LABEL_KEYS: Record<
  BrainProvider,
  "openAi" | "anthropic" | "google" | "nullxes" | "xai"
> = {
  openai: "openAi",
  anthropic: "anthropic",
  google: "google",
  nullxes: "nullxes",
  xai: "xai",
};

const PROVIDER_DESCRIPTION_KEYS: Record<
  BrainProvider,
  | "openAiDescription"
  | "anthropicDescription"
  | "googleDescription"
  | "nullxesDescription"
  | "xaiDescription"
> = {
  openai: "openAiDescription",
  anthropic: "anthropicDescription",
  google: "googleDescription",
  nullxes: "nullxesDescription",
  xai: "xaiDescription",
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
  const isWizard = variant === "wizard";

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        variant === "settings" && "sm:gap-3",
      )}
    >
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
              "flex h-full min-h-[5.5rem] flex-col rounded-xl border p-3 text-left transition-colors",
              isWizard
                ? selected
                  ? "border-white/30 bg-white/6"
                  : "border-white/10 bg-black/30 hover:border-white/20"
                : selected
                  ? "border-foreground/30 bg-background/60"
                  : "border-border bg-background/40 hover:border-foreground/20",
              !selectable && "cursor-not-allowed opacity-50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  "text-sm font-medium",
                  isWizard ? "text-white" : "text-foreground",
                )}
              >
                {t(PROVIDER_LABEL_KEYS[provider])}
              </p>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                  isWizard
                    ? "border-white/20 text-white/60"
                    : "border-border text-muted-foreground",
                )}
              >
                {t(READINESS_BADGE_KEYS[readiness])}
              </span>
            </div>
            <p
              className={cn(
                "mt-2 line-clamp-2 text-xs leading-relaxed",
                isWizard ? "text-white/50" : "text-muted-foreground",
              )}
            >
              {t(PROVIDER_DESCRIPTION_KEYS[provider])}
            </p>
          </button>
        );
      })}
    </div>
  );
}

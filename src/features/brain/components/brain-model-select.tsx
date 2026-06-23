"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { BrainProvider } from "@/entities/digital-employee";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getBrainModelsAction } from "../actions/get-brain-models";
import type { BrainModelOption } from "../actions/get-brain-models";

const GROUP_LABEL_KEYS: Record<string, string> = {
  recommended: "modelGroupRecommended",
  balanced: "modelGroupBalanced",
  fast: "modelGroupFast",
  managed: "modelGroupManaged",
};

const GROUP_ORDER = ["recommended", "balanced", "fast", "managed"] as const;

function groupModels(models: BrainModelOption[]): Map<string, BrainModelOption[]> {
  const groups = new Map<string, BrainModelOption[]>();

  for (const model of models) {
    const groupKey = model.groupKey ?? "recommended";
    const existing = groups.get(groupKey) ?? [];
    existing.push(model);
    groups.set(groupKey, existing);
  }

  return groups;
}

function WizardModelList({
  models,
  value,
  disabled,
  onValueChange,
  groupLabel,
}: {
  models: BrainModelOption[];
  value: string;
  disabled?: boolean;
  groupLabel: (groupKey: string) => string;
  onValueChange: (value: string) => void;
}) {
  const groupedModels = useMemo(() => groupModels(models), [models]);
  const orderedGroups = GROUP_ORDER.filter((key) => groupedModels.has(key));

  for (const key of groupedModels.keys()) {
    if (!GROUP_ORDER.includes(key as (typeof GROUP_ORDER)[number])) {
      orderedGroups.push(key as (typeof GROUP_ORDER)[number]);
    }
  }

  return (
    <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-black/30">
      {orderedGroups.map((groupKey) => {
        const groupItems = groupedModels.get(groupKey) ?? [];

        return (
          <div key={groupKey} className="border-b border-white/10 last:border-b-0">
            <p className="sticky top-0 bg-[#0d0d0d]/95 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-white/40 backdrop-blur-sm">
              {groupLabel(groupKey)}
            </p>
            <ul className="flex flex-col">
              {groupItems.map((model) => {
                const selected = model.id === value;

                return (
                  <li key={model.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onValueChange(model.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "bg-white/8 text-white"
                          : "text-white/75 hover:bg-white/4",
                      )}
                    >
                      <span className="min-w-0 truncate text-sm">{model.label}</span>
                      {model.pricingLabel ? (
                        <span className="shrink-0 text-xs text-white/40">
                          {model.pricingLabel}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function BrainModelSelect({
  provider,
  value,
  disabled,
  variant = "settings",
  label,
  onValueChange,
}: {
  provider: BrainProvider;
  value: string;
  disabled?: boolean;
  variant?: "settings" | "wizard";
  label?: string;
  onValueChange: (value: string) => void;
}) {
  const t = useTranslations(
    variant === "wizard" ? "employees.studio.brain" : "settings.ai",
  );
  const [models, setModels] = useState<BrainModelOption[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isWizard = variant === "wizard";

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      setStatus("loading");
      setErrorMessage(null);

      const result = await getBrainModelsAction(provider);

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setStatus("error");
        setErrorMessage(result.message);
        return;
      }

      setModels(result.models);
      setStatus("ready");
    }

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, [provider]);

  useEffect(() => {
    if (status !== "ready" || models.length === 0) {
      return;
    }

    if (!models.some((model) => model.id === value)) {
      onValueChange(models[0]?.id ?? value);
    }
  }, [models, onValueChange, status, value]);

  const groupedModels = useMemo(() => groupModels(models), [models]);
  const selectedModel = models.find((model) => model.id === value);

  function groupLabel(groupKey: string): string {
    return t(
      (GROUP_LABEL_KEYS[groupKey] ?? "modelGroupRecommended") as "modelGroupRecommended",
    );
  }

  const loadingClass = isWizard
    ? "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/55"
    : "rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground";

  return (
    <div className="space-y-2">
      {label ? (
        <Label className={isWizard ? "text-white/80" : "text-muted-foreground"}>
          {label}
        </Label>
      ) : null}
      {status === "loading" ? <p className={loadingClass}>{t("modelsLoading")}</p> : null}
      {status === "error" ? (
        <p className={loadingClass}>{errorMessage ?? t("modelsLoadFailed")}</p>
      ) : null}
      {status === "ready" && isWizard ? (
        <WizardModelList
          models={models}
          value={value}
          disabled={disabled}
          groupLabel={groupLabel}
          onValueChange={onValueChange}
        />
      ) : null}
      {status === "ready" && !isWizard ? (
        <>
          <Select value={value} disabled={disabled} onValueChange={onValueChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from(groupedModels.entries()).map(([groupKey, groupItems]) => (
                <SelectGroup key={groupKey}>
                  <SelectLabel>{groupLabel(groupKey)}</SelectLabel>
                  {groupItems.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.pricingLabel
                        ? `${model.label} · ${model.pricingLabel}`
                        : model.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {selectedModel?.pricingLabel ? (
            <p className="text-xs text-muted-foreground">{selectedModel.pricingLabel}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

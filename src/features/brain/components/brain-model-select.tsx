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
import { getBrainModelsAction } from "../actions/get-brain-models";
import type { BrainModelOption } from "../actions/get-brain-models";

const GROUP_LABEL_KEYS: Record<string, string> = {
  recommended: "modelGroupRecommended",
  balanced: "modelGroupBalanced",
  fast: "modelGroupFast",
  managed: "modelGroupManaged",
};

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

  return (
    <div className="space-y-2">
      {label ? (
        <Label
          className={
            variant === "wizard" ? "text-white/80" : "text-muted-foreground"
          }
        >
          {label}
        </Label>
      ) : null}
      {status === "loading" ? (
        <p
          className={
            variant === "wizard"
              ? "rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/55"
              : "rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground"
          }
        >
          {t("modelsLoading")}
        </p>
      ) : null}
      {status === "error" ? (
        <p
          className={
            variant === "wizard"
              ? "rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/55"
              : "rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground"
          }
        >
          {errorMessage ?? t("modelsLoadFailed")}
        </p>
      ) : null}
      {status === "ready" ? (
        <>
          <Select value={value} disabled={disabled} onValueChange={onValueChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from(groupedModels.entries()).map(([groupKey, groupItems]) => (
                <SelectGroup key={groupKey}>
                  <SelectLabel>
                    {t(
                      (GROUP_LABEL_KEYS[groupKey] ??
                        "modelGroupRecommended") as "modelGroupRecommended",
                    )}
                  </SelectLabel>
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
            <p
              className={
                variant === "wizard"
                  ? "text-xs text-white/45"
                  : "text-xs text-muted-foreground"
              }
            >
              {selectedModel.pricingLabel}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

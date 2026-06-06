"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOpenAiBrainModelsAction } from "../actions/get-openai-brain-models";
import type { OpenAiBrainModelOption } from "../services/fetch-openai-chat-models";

export function DefaultBrainModelField({
  value,
  disabled,
  onValueChange,
}: {
  value: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
}) {
  const t = useTranslations("settings.general");
  const [models, setModels] = useState<OpenAiBrainModelOption[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      setStatus("loading");
      setErrorMessage(null);

      const result = await getOpenAiBrainModelsAction();

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
  }, []);

  useEffect(() => {
    if (status !== "ready" || models.length === 0) {
      return;
    }

    if (!models.some((model) => model.id === value)) {
      onValueChange(models[0]?.id ?? value);
    }
  }, [models, onValueChange, status, value]);

  const selectedModel = models.find((model) => model.id === value);

  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{t("defaultModel")}</Label>
      {status === "loading" ? (
        <p className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
          {t("modelsLoading")}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
          {errorMessage ?? t("modelsLoadFailed")}
        </p>
      ) : null}
      {status === "ready" ? (
        <>
          <Select
            value={value}
            disabled={disabled}
            onValueChange={onValueChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.pricingLabel
                    ? `${model.id} · ${model.pricingLabel}`
                    : model.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModel?.pricingLabel ? (
            <p className="text-xs text-muted-foreground">
              {selectedModel.pricingLabel}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("pricingUnavailable")}
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

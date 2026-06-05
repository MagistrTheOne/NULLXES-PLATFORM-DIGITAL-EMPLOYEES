"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AvatarGenerationStatus } from "@/features/employees/create/types";

export function AvatarGenerationState({
  status,
  errorMessage,
  canGenerate,
  onGenerate,
}: {
  status: AvatarGenerationStatus;
  errorMessage: string | null;
  canGenerate: boolean;
  onGenerate: () => void;
}) {
  const t = useTranslations("employees.studio.avatar");
  const isGenerating = status === "generating" || status === "uploading";

  return (
    <div className="flex flex-col gap-3">
      {isGenerating ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white/70">
          <Loader2 className="size-4 animate-spin text-white/60" />
          {t("generating")}
        </div>
      ) : null}

      {status === "failed" && errorMessage ? (
        <p className="text-sm text-white/70" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        disabled={!canGenerate || isGenerating}
        onClick={onGenerate}
        className="border-white/10 bg-transparent text-white hover:bg-white/5"
      >
        {status === "ready" ? t("regenerate") : t("generate")}
      </Button>
    </div>
  );
}

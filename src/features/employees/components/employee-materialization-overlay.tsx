"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useEmployeeMaterializationProgress,
  type MaterializationStage,
} from "../lib/use-employee-materialization-progress";
import { useEmployeeMaterializeAmbient } from "../lib/use-employee-materialize-ambient";
import { EmployeeMaterializationPortrait } from "./employee-materialization-portrait";

export type EmployeeMaterializationTarget = {
  employeeId: string;
  name: string;
  role: string;
  portraitPreviewUrl: string;
};

type EmployeeMaterializationOverlayProps = {
  target: EmployeeMaterializationTarget;
  onDismiss: () => void;
  onReady?: () => void;
};

function stageLabelKey(stage: MaterializationStage): string {
  return `stages.${stage}`;
}

export function EmployeeMaterializationOverlay({
  target,
  onDismiss,
  onReady,
}: EmployeeMaterializationOverlayProps) {
  const t = useTranslations("employees.materialization");
  const [ambientMuted, setAmbientMuted] = useState(true);
  const { progress, stage, snapshot, portraitUrl } =
    useEmployeeMaterializationProgress(target.employeeId);

  const displayPortrait =
    portraitUrl ?? (target.portraitPreviewUrl || null);
  const isReady = snapshot?.canTalk === true;
  const isFailed = snapshot?.failed === true;
  const ambientActive = !isReady && !isFailed;

  useEmployeeMaterializeAmbient(ambientActive, ambientMuted);

  const readyHandledRef = useRef(false);

  useEffect(() => {
    if (!isReady || readyHandledRef.current) {
      return;
    }

    readyHandledRef.current = true;
    onReady?.();
  }, [isReady, onReady]);

  const visualProgress = isReady ? 100 : progress;

  const stageText = useMemo(() => {
    if (isFailed) {
      return t("failed");
    }

    if (isReady) {
      return t("ready");
    }

    return t(stageLabelKey(stage));
  }, [isFailed, isReady, stage, t]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-materialization-title"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-xs tracking-[0.2em] text-white/45 uppercase">
            {t("eyebrow")}
          </p>
          <h2
            id="employee-materialization-title"
            className="mt-2 text-2xl font-medium tracking-tight text-white"
          >
            {t("title", { name: target.name })}
          </h2>
          <p className="mt-1 text-sm text-white/55">{target.role}</p>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <div className="relative aspect-4/3 w-full">
            <EmployeeMaterializationPortrait
              src={displayPortrait}
              alt={target.name}
              progress={visualProgress}
              isReady={isReady}
              isFailed={isFailed}
              priority
              sizes="(max-width: 768px) 100vw, 448px"
            />
          </div>

          <div className="border-t border-white/8 px-5 py-4">
            <p
              className={cn(
                "text-center text-sm transition-colors duration-500",
                isReady ? "text-white" : "text-white/65",
              )}
            >
              {stageText}
            </p>
            <div className="mt-3 h-px overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white transition-[width] duration-700 ease-out"
                style={{ width: `${visualProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {ambientActive ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-white/12 bg-transparent text-white hover:bg-white/5"
              aria-label={ambientMuted ? t("unmuteAmbient") : t("muteAmbient")}
              onClick={() => setAmbientMuted((current) => !current)}
            >
              {ambientMuted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </Button>
          ) : null}

          {isReady ? (
            <Button
              asChild
              className="bg-white text-black hover:bg-white/90"
            >
              <Link href={`/dashboard/employees/${target.employeeId}`}>
                {t("viewEmployee")}
              </Link>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="border-white/12 bg-transparent text-white hover:bg-white/5"
            onClick={onDismiss}
          >
            {isReady ? t("close") : t("continueInBackground")}
          </Button>

          {isFailed ? (
            <Button
              asChild
              variant="outline"
              className="border-white/12 bg-transparent text-white hover:bg-white/5"
            >
              <Link href={`/dashboard/employees/${target.employeeId}`}>
                {t("viewEmployee")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

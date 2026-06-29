"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Activity, ArrowLeft, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTalkAnam } from "../context/talk-anam-context";

function formatElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function TalkWorkspaceHeader({
  employeeName,
  sessionLimitSeconds,
  sessionBusy,
  onEndSession,
  onLimitReached,
  onOpenDetails,
}: {
  employeeName: string;
  sessionLimitSeconds: number;
  sessionBusy: boolean;
  onEndSession: () => void;
  onLimitReached?: () => void;
  onOpenDetails?: () => void;
}) {
  const t = useTranslations("employees.talk");
  const tCommon = useTranslations("common.actions");
  const { isLive } = useTalkAnam();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLive) {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    if (!isLive || !onLimitReached) {
      return;
    }
    if (elapsed >= sessionLimitSeconds) {
      onLimitReached();
    }
  }, [elapsed, isLive, onLimitReached, sessionLimitSeconds]);

  return (
    <header className="flex shrink-0 flex-col border-b border-white/8">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 lg:px-5">
        <div className="min-w-0">
          <Link
            href="/dashboard/employees"
            className="mb-2 inline-flex items-center gap-1.5 text-[11px] text-white/45 transition-colors hover:text-white/75"
          >
            <ArrowLeft className="size-3 stroke-[1.5]" />
            {tCommon("back")}
          </Link>
          <h1 className="text-base font-medium tracking-tight text-white lg:text-lg">
            {t("title", { name: employeeName })}
          </h1>
          <p className="mt-0.5 text-[11px] text-white/45 lg:text-xs">
            {t("workspaceSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-3 text-[11px] text-white/45 sm:flex">
            <span className="flex items-center gap-1.5">
              <Activity
                className={cn(
                  "size-3.5 stroke-[1.5]",
                  isLive ? "text-emerald-400" : "text-white/35",
                )}
              />
              {isLive ? t("statusOnline") : t("idle")}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 stroke-[1.5]" />
              {t("statusSecure")}
            </span>
            <span className="tabular-nums text-white/55">
              {formatElapsed(elapsed)}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sessionBusy}
            onClick={onEndSession}
            className="h-8 border-red-500/35 bg-transparent px-3 text-[11px] text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            {t("endSession")}
          </Button>
          {onOpenDetails ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sessionBusy}
              onClick={onOpenDetails}
              className="h-8 border-white/15 bg-transparent px-3 text-[11px] text-white/75 hover:bg-white/10 lg:hidden"
            >
              <Info className="size-3.5" />
              {t("mobileTabDetails")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-white/6 px-4 py-2 text-[10px] text-white/40 sm:hidden">
        <span className="flex items-center gap-1">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isLive ? "bg-emerald-400" : "bg-white/30",
            )}
          />
          {isLive ? t("statusOnline") : t("idle")}
        </span>
        <span>·</span>
        <span>{t("statusSecure")}</span>
        <span>·</span>
        <span className="tabular-nums">{formatElapsed(elapsed)}</span>
      </div>
    </header>
  );
}

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { TalkWorkforceSnapshot } from "../queries/get-talk-workforce-snapshot";

function MetricSparkline({ seed }: { seed: number }) {
  const path = useMemo(() => {
    const values: number[] = [];
    let value = 0.4 + (seed % 5) * 0.05;
    for (let index = 0; index < 16; index += 1) {
      value += Math.sin(seed * 0.5 + index) * 0.06;
      value = Math.min(0.95, Math.max(0.08, value));
      values.push(value);
    }

    return values
      .map((point, index) => {
        const x = (index / (values.length - 1)) * 100;
        const y = (1 - point) * 100;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [seed]);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-7 w-full text-white/50"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  seed: number;
};

function MetricCard({ label, value, detail, seed }: MetricCardProps) {
  return (
    <div className="talk-workforce-card rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <p className="text-[10px] tracking-[0.14em] text-white/45 uppercase">
        {label}
      </p>
      <p className="mt-1 text-xl font-medium tabular-nums text-white">{value}</p>
      <p className="text-[10px] text-white/40">{detail}</p>
      <div className="mt-2">
        <MetricSparkline seed={seed} />
      </div>
    </div>
  );
}

export function TalkWorkforceStrip({
  snapshot,
}: {
  snapshot: TalkWorkforceSnapshot;
}) {
  const t = useTranslations("employees.talk.workforce");

  const onlinePercent =
    snapshot.employeesTotal > 0
      ? Math.round(
          (snapshot.employeesOnline / snapshot.employeesTotal) * 100,
        )
      : 0;

  const loadLabel =
    snapshot.systemLoadPercent >= 85
      ? t("loadHigh")
      : snapshot.systemLoadPercent >= 60
        ? t("loadModerate")
        : t("loadOptimal");

  return (
    <div className="talk-workforce-strip grid grid-cols-2 gap-2 lg:grid-cols-5">
      <MetricCard
        label={t("liveSessions")}
        value={String(snapshot.liveSessions)}
        detail={t("liveSessionsDetail")}
        seed={snapshot.liveSessions + 1}
      />
      <MetricCard
        label={t("employeesOnline")}
        value={`${onlinePercent}%`}
        detail={t("employeesOnlineDetail", {
          online: snapshot.employeesOnline,
          total: snapshot.employeesTotal,
        })}
        seed={onlinePercent + 2}
      />
      <MetricCard
        label={t("tasksInProgress")}
        value={String(snapshot.tasksInProgress)}
        detail={t("tasksInProgressDetail")}
        seed={snapshot.tasksInProgress + 3}
      />
      <MetricCard
        label={t("systemLoad")}
        value={`${snapshot.systemLoadPercent}%`}
        detail={loadLabel}
        seed={snapshot.systemLoadPercent + 4}
      />
      <MetricCard
        label={t("uptime")}
        value={`${snapshot.uptimePercent.toFixed(1)}%`}
        detail={snapshot.uptimeLabel}
        seed={Math.round(snapshot.uptimePercent) + 5}
      />
    </div>
  );
}

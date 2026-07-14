"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Radio } from "lucide-react";

function useClock(): string {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const sync = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    sync();
    const id = window.setInterval(sync, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

export function HqStatusBar({
  liveCount,
  onFloor,
  workforceTotal,
}: {
  liveCount: number;
  onFloor: number;
  workforceTotal: number;
}) {
  const t = useTranslations("hq");
  const clock = useClock();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          {t("title")}
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/70">
          <Radio className="size-3 stroke-[1.5]" aria-hidden />
          {t("live")}
          {liveCount > 0 ? (
            <span className="tabular-nums text-white/50">{liveCount}</span>
          ) : null}
        </span>
        <span className="text-[11px] tabular-nums text-white/40">
          {t("workforceOnFloor", {
            onFloor,
            total: workforceTotal,
          })}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-white/45">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#34d399]" />
          {t("systemOnline")}
        </span>
        {clock ? (
          <>
            <span className="text-white/20">·</span>
            <span className="tabular-nums">{clock}</span>
          </>
        ) : null}
      </div>
    </header>
  );
}

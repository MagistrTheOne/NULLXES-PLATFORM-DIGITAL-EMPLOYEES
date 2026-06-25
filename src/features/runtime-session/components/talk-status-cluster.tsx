"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Activity, ShieldCheck } from "lucide-react";
import { useTalkAnam } from "../context/talk-anam-context";

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
    const timer = window.setInterval(sync, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return time;
}

export function TalkStatusCluster() {
  const t = useTranslations("employees.talk");
  const { isLive } = useTalkAnam();
  const time = useClock();

  return (
    <div className="hidden items-center gap-4 text-[11px] text-white/45 md:flex">
      <span className="flex items-center gap-1.5">
        <Activity
          className={`size-3.5 stroke-[1.5] ${isLive ? "text-white" : "opacity-50"}`}
          aria-hidden
        />
        {t("statusOnline")}
      </span>
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 stroke-[1.5]" aria-hidden />
        {t("statusSecure")}
      </span>
      {time ? <span className="tabular-nums text-white/40">{time}</span> : null}
    </div>
  );
}

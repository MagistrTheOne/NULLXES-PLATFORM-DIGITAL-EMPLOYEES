"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
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

function useIsSecureConnection(): boolean {
  const [secure, setSecure] = useState(false);

  useEffect(() => {
    setSecure(window.location.protocol === "https:");
  }, []);

  return secure;
}

function StatusAsterisk({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <span
        aria-hidden
        className={cn(
          "text-sm font-semibold leading-none",
          active ? "text-emerald-400" : "text-red-400",
        )}
      >
        *
      </span>
      <span>{label}</span>
    </span>
  );
}

export function TalkStatusCluster() {
  const t = useTranslations("employees.talk");
  const { isLive } = useTalkAnam();
  const isSecure = useIsSecureConnection();
  const time = useClock();

  return (
    <div className="hidden items-center gap-4 text-[11px] text-white/45 md:flex">
      <StatusAsterisk
        active={isLive}
        label={isLive ? t("statusOnline") : t("idle")}
      />
      <StatusAsterisk
        active={isSecure}
        label={isSecure ? t("statusSecure") : t("statusInsecure")}
      />
      {time ? <span className="tabular-nums text-white/40">{time}</span> : null}
    </div>
  );
}

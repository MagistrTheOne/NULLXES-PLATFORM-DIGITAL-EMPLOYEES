"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const PRESENCE_KEYS = [
  "available",
  "working",
  "researching",
  "reviewing",
  "preparing",
  "ready",
] as const;

const ACTIVITY_KEYS = [
  "reviewing",
  "drafting",
  "analyzing",
  "preparing",
  "syncing",
] as const;

const PRESENCE_INTERVAL_MS = 45000;

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/**
 * Lightweight, presentation-only "living" presence. Each employee starts on a
 * stable status derived from its id (so it feels personal, not random), then
 * drifts every ~45s while online. No backend signal — purely cosmetic identity.
 */
function useRotatingIndex(
  seed: string,
  length: number,
  active: boolean,
): number {
  const [index, setIndex] = useState(() => hashSeed(seed) % length);

  useEffect(() => {
    setIndex(hashSeed(seed) % length);
    if (!active) {
      return;
    }
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, PRESENCE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [seed, length, active]);

  return index;
}

export function EmployeePresenceBadge({
  employeeId,
  online = true,
  className,
  labelClassName,
}: {
  employeeId: string;
  online?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  const t = useTranslations("conversations.presence");
  const index = useRotatingIndex(employeeId, PRESENCE_KEYS.length, online);
  const label = online ? t(PRESENCE_KEYS[index]!) : t("offline");

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          online ? "nullxes-presence-dot bg-brand" : "bg-white/25",
        )}
      />
      <span className={cn("truncate", labelClassName)}>{label}</span>
    </span>
  );
}

export function EmployeePresenceActivity({
  employeeId,
  online = true,
  className,
}: {
  employeeId: string;
  online?: boolean;
  className?: string;
}) {
  const t = useTranslations("conversations.presence");
  const index = useRotatingIndex(
    `${employeeId}:activity`,
    ACTIVITY_KEYS.length,
    online,
  );

  if (!online) {
    return null;
  }

  return (
    <p className={cn("text-[11px] leading-relaxed text-white/35", className)}>
      <span className="text-white/30">{t("currentlyLabel")}</span>{" "}
      {t(`activity.${ACTIVITY_KEYS[index]!}`)}
    </p>
  );
}

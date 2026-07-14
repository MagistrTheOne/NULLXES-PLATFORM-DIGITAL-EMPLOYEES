"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import type { HqTimelineEvent } from "../types";

function formatWhen(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function kindLabel(
  kind: HqTimelineEvent["kind"],
  t: (key: "kindCapsule" | "kindEquip" | "kindMission") => string,
): string {
  switch (kind) {
    case "capsule":
      return t("kindCapsule");
    case "equip":
      return t("kindEquip");
    case "mission":
    default:
      return t("kindMission");
  }
}

export function HqMissionTimeline({
  events,
}: {
  events: HqTimelineEvent[];
}) {
  const t = useTranslations("hq.timeline");
  const locale = useLocale();

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0B0B0B]">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-xs text-white/40">{t("description")}</p>
        </div>
        <Link
          href="/dashboard/missions"
          className="inline-flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-white"
        >
          {t("openJournal")}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="px-5 py-8 text-center text-xs text-white/35">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-white/6">
          {events.map((event) => {
            const href =
              event.href ??
              (event.kind === "capsule"
                ? "/dashboard/capsules"
                : event.kind === "equip" && event.employeeId
                  ? `/dashboard/employees/${event.employeeId}`
                  : event.missionId
                    ? `/dashboard/missions?mission=${event.missionId}`
                    : "/dashboard/missions");
            return (
              <li key={event.id}>
                <Link
                  href={href}
                  className="flex items-start justify-between gap-4 px-5 py-3 transition-colors hover:bg-white/3 rounded-xl"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.14em] text-white/35 uppercase">
                      {kindLabel(event.kind, t)}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-white/90">
                      {event.label}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/40">
                      {event.employeeName}
                      {event.missionTitle ? ` · ${event.missionTitle}` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 text-[11px] tabular-nums text-white/35">
                    {formatWhen(event.at, locale)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

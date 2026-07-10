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
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-start justify-between gap-4 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-white/90">{event.label}</p>
                <p className="mt-0.5 truncate text-xs text-white/40">
                  {event.employeeName}
                  {event.missionTitle ? ` · ${event.missionTitle}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[11px] tabular-nums text-white/40">
                  {formatWhen(event.at, locale)}
                </span>
                <Link
                  href={`/dashboard/missions/${event.missionId}`}
                  className="text-[11px] text-white/45 hover:text-white"
                >
                  {t("open")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

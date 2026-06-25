"use client";

import { useLocale, useTranslations } from "next-intl";
import type { OvernightWorkEventRow } from "@/features/overview/queries/get-overnight-work-events";
import { formatRelativeTime } from "../lib/format-relative-time";
import { OverviewCard } from "./overview-card";

export function OverviewOvernightWork({
  events,
  embedded = false,
}: {
  events: OvernightWorkEventRow[];
  embedded?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard.overnight");

  return (
    <OverviewCard
      title={embedded ? undefined : t("title")}
      description={embedded ? undefined : t("description")}
      className={embedded ? undefined : "min-h-[280px]"}
    >
      <div className={embedded ? "flex flex-col" : "flex min-h-[220px] flex-col"}>
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          <span className="text-sm text-muted-foreground">{t("event")}</span>
          <span className="text-sm text-muted-foreground">{t("when")}</span>
        </div>
        <ul className="flex-1 space-y-0 overflow-y-auto">
          {events.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">
              {t("empty")}
            </li>
          ) : (
            events.map((event) => (
              <li
                key={event.id}
                className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.employeeName}
                    {" · "}
                    {t(`types.${event.eventType}`, {
                      defaultValue: event.eventType,
                    })}
                  </p>
                  {event.summary ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {event.summary}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(event.createdAt, locale)}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </OverviewCard>
  );
}

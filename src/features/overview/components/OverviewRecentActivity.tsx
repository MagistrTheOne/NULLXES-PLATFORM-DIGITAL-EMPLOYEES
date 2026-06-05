"use client";

import { useLocale, useTranslations } from "next-intl";
import type { RecentLifecycleEventRow } from "@/features/analytics/types";
import { formatRelativeTime } from "../lib/format-relative-time";
import { OverviewCard } from "./overview-card";

export function OverviewRecentActivity({
  events,
}: {
  events: RecentLifecycleEventRow[];
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard.activity");

  function formatActivityMessage(event: RecentLifecycleEventRow): string {
    switch (event.eventType) {
      case "created":
        return t("created", { name: event.employeeName });
      case "activated":
        return t("activated", { name: event.employeeName });
      case "paused":
        return t("paused", { name: event.employeeName });
      case "archived":
        return t("archived", { name: event.employeeName });
      case "runtime_updated":
        return t("runtimeUpdated", { name: event.employeeName });
      case "knowledge_updated":
        return t("knowledgeUpdated", { name: event.employeeName });
      default:
        return t("generic", { name: event.employeeName });
    }
  }

  return (
    <OverviewCard
      title={t("title")}
      description={t("description")}
      className="min-h-[360px]"
    >
      <div className="flex min-h-[calc(360px-57px)] flex-col">
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
                  <p className="text-sm text-foreground">
                    {formatActivityMessage(event)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.actorName}
                    {event.reason ? ` · ${event.reason}` : ""}
                  </p>
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

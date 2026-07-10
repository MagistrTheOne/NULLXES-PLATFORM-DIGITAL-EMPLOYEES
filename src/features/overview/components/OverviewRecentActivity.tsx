"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecentLifecycleEventRow } from "@/features/analytics/types";
import { formatRelativeTime } from "../lib/format-relative-time";
import { OverviewCard } from "./overview-card";

const PAGE_SIZE = 5;

export function OverviewRecentActivity({
  events,
  embedded = false,
}: {
  events: RecentLifecycleEventRow[];
  embedded?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard.activity");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(Math.max(1, current), totalPages));
  }, [totalPages]);

  const pageEvents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return events.slice(start, start + PAGE_SIZE);
  }, [events, page]);

  const rangeStart = events.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, events.length);
  const showPagination = events.length > 0;

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
      title={embedded ? undefined : t("title")}
      description={embedded ? undefined : t("description")}
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-2.5">
          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {t("event")}
          </span>
          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {t("when")}
          </span>
        </div>

        <ul className="h-90 overflow-hidden">
          {events.length === 0 ? (
            <li className="flex h-full items-center justify-center px-5 text-center text-sm text-muted-foreground">
              {t("empty")}
            </li>
          ) : (
            pageEvents.map((event) => (
              <li
                key={event.id}
                className="flex h-18 items-start justify-between gap-3 border-b border-border px-5 py-3.5 last:border-b-0 sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {formatActivityMessage(event)}
                  </p>
                  <p className="mt-1 hidden truncate text-xs text-muted-foreground sm:block">
                    {event.actorName}
                    {event.reason ? ` · ${event.reason}` : ""}
                  </p>
                </div>
                <span className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                  {formatRelativeTime(event.createdAt, locale)}
                </span>
              </li>
            ))
          )}
        </ul>

        {showPagination ? (
          <div className="flex flex-col gap-2 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs tabular-nums text-muted-foreground">
              {t("showing", {
                start: rangeStart,
                end: rangeEnd,
                total: events.length,
              })}
            </p>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs tabular-nums text-muted-foreground">
                {t("pageOf", { page, total: totalPages })}
              </span>
              <nav
                aria-label={t("pagesAria")}
                className="flex items-center gap-1"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("previousPage")}
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("nextPage")}
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </nav>
            </div>
          </div>
        ) : null}
      </div>
    </OverviewCard>
  );
}

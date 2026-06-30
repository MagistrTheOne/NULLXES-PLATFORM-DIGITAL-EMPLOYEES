"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchAuditEventsAction } from "../actions/search-audit-events";
import type { AuditEventListItem } from "../types";
import { SettingsCard } from "./settings-card";

function formatTimestamp(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SettingsAuditTab({
  initialEvents,
  initialTotal,
}: {
  initialEvents: AuditEventListItem[];
  initialTotal: number;
}) {
  const t = useTranslations("settings.audit");
  const [events, setEvents] = useState(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSearch(offset = 0, append = false): void {
    startTransition(async () => {
      const result = await searchAuditEventsAction({
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        offset,
        limit: 50,
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setEvents((current) =>
        append ? [...current, ...result.events] : result.events,
      );
      setTotal(result.total);
      setMessage(null);
    });
  }

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="audit-search">{t("search")}</Label>
          <Input
            id="audit-search"
            value={search}
            placeholder={t("searchPlaceholder")}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-from">{t("from")}</Label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-to">{t("to")}</Label>
          <Input
            id="audit-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" disabled={isPending} onClick={() => runSearch(0, false)}>
          {t("applyFilters")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            setSearch("");
            setFrom("");
            setTo("");
            setEvents(initialEvents);
            setTotal(initialTotal);
            setMessage(null);
          }}
        >
          {t("reset")}
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">{event.action}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(event.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.resourceType ?? t("unknownResource")}
                {event.resourceId ? ` · ${event.resourceId}` : ""}
              </p>
              {event.actorRole ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("actor", { role: event.actorRole })}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {events.length < total ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => runSearch(events.length, true)}
          >
            {t("loadMore", { shown: events.length, total })}
          </Button>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </SettingsCard>
  );
}

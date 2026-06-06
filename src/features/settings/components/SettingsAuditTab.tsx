"use client";

import { useTranslations } from "next-intl";
import type { AuditEventListItem } from "../types";
import { SettingsCard } from "./settings-card";

function formatTimestamp(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SettingsAuditTab({
  events,
}: {
  events: AuditEventListItem[];
}) {
  const t = useTranslations("settings.audit");

  return (
    <SettingsCard title={t("title")} description={t("description")}>
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
    </SettingsCard>
  );
}

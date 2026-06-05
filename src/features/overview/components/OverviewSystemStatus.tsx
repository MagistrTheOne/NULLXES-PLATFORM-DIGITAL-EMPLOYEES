"use client";

import { useTranslations } from "next-intl";
import type { SystemStatusItem, SystemStatusState } from "../types";
import { OverviewCard } from "./overview-card";

const SERVICE_LABEL_KEYS: Record<string, string> = {
  Database: "database",
  "AI Services": "aiServices",
  "Voice Services": "voiceServices",
  "Avatar Services": "avatarServices",
  "Knowledge Services": "knowledgeServices",
  Storage: "storage",
};

const DETAIL_KEYS: Record<string, string> = {
  Connected: "connected",
  Configured: "configured",
  "Not configured": "notConfigured",
  "Ready for indexing": "readyForIndexing",
  "Requires AI provider": "requiresAiProvider",
  "Neon PostgreSQL": "neonPostgresql",
};

export function OverviewSystemStatus({
  items,
}: {
  items: SystemStatusItem[];
}) {
  const t = useTranslations("dashboard.systemStatus");
  const allOperational = items.every((item) => item.status === "operational");

  function statusLabel(status: SystemStatusState): string {
    switch (status) {
      case "operational":
        return t("operational");
      case "degraded":
        return t("degraded");
      case "unavailable":
        return t("unavailable");
    }
  }

  function translateLabel(label: string): string {
    const key = SERVICE_LABEL_KEYS[label];
    return key ? t(`services.${key}` as "services.database") : label;
  }

  function translateDetail(detail: string): string {
    const key = DETAIL_KEYS[detail];
    return key ? t(`details.${key}` as "details.connected") : detail;
  }

  return (
    <OverviewCard
      title={t("title")}
      description={allOperational ? t("allOperational") : t("needsAttention")}
    >
      <ul className="space-y-3 px-5 py-5">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm text-foreground">{translateLabel(item.label)}</p>
              <p className="text-xs text-muted-foreground">
                {translateDetail(item.detail)}
              </p>
            </div>
            <span className="shrink-0 text-xs text-foreground/70">
              {statusLabel(item.status)}
            </span>
          </li>
        ))}
      </ul>
    </OverviewCard>
  );
}

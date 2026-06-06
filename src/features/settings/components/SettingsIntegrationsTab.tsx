"use client";

import { useTranslations } from "next-intl";
import type { SystemStatusItem } from "@/features/overview/types";
import { SettingsCard } from "./settings-card";

function statusLabel(
  status: SystemStatusItem["status"],
  t: ReturnType<typeof useTranslations<"settings.integrations">>,
): string {
  switch (status) {
    case "operational":
      return t("connected");
    case "degraded":
      return t("degraded");
    case "unavailable":
      return t("notConfigured");
  }
}

export function SettingsIntegrationsTab({
  integrations,
}: {
  integrations: SystemStatusItem[];
}) {
  const t = useTranslations("settings.integrations");

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      <ul className="space-y-3">
        {integrations.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3"
          >
            <div>
              <p className="text-sm text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <span className="text-xs text-foreground/70">
              {statusLabel(item.status, t)}
            </span>
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}

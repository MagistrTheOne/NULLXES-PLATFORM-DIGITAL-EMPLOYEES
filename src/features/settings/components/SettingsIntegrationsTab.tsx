"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SystemStatusItem } from "@/features/overview/types";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./settings-card";

const SERVICE_LABEL_KEYS: Record<string, string> = {
  Database: "database",
  "AI Services": "aiServices",
  "Voice Services": "voiceServices",
  "Avatar Services": "avatarServices",
  "Knowledge Services": "knowledgeServices",
  Storage: "storage",
  "Anam (employee configs)": "anamEmployeeConfigs",
  "ElevenLabs (employee configs)": "elevenLabsEmployeeConfigs",
  Slack: "slack",
  "Microsoft Teams": "microsoftTeams",
};

const DETAIL_KEYS: Record<string, string> = {
  Connected: "connected",
  Configured: "configured",
  "Not configured": "notConfigured",
  "Ready for indexing": "readyForIndexing",
  "Requires AI provider": "requiresAiProvider",
  "Neon PostgreSQL": "neonPostgresql",
  "OAuth connected": "oauthConnected",
  "Connect via OAuth (Phase S.5)": "connectViaOauth",
  "No employee avatar configs yet": "noAvatarConfigs",
  "No employee voice/session configs yet": "noVoiceConfigs",
};

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
  const [open, setOpen] = useState(false);

  const connectedCount = integrations.filter(
    (item) => item.status === "operational",
  ).length;
  const attentionCount = integrations.length - connectedCount;

  function translateLabel(label: string): string {
    const key = SERVICE_LABEL_KEYS[label];
    return key ? t(`services.${key}` as "services.database") : label;
  }

  function translateDetail(detail: string): string {
    if (/^\d+ avatar provider config\(s\)$/.test(detail)) {
      return t("details.avatarProviderConfigs", {
        count: Number.parseInt(detail, 10),
      });
    }

    if (/^\d+ session provider config\(s\)$/.test(detail)) {
      return t("details.sessionProviderConfigs", {
        count: Number.parseInt(detail, 10),
      });
    }

    const key = DETAIL_KEYS[detail];
    return key ? t(`details.${key}` as "details.connected") : detail;
  }

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-left transition-colors hover:bg-background/60">
          <div className="min-w-0">
            <p className="text-sm text-foreground">{t("summaryTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("summaryStats", {
                connected: connectedCount,
                total: integrations.length,
                attention: attentionCount,
              })}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-3">
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {integrations.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {translateLabel(item.label)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {translateDetail(item.detail)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-foreground/70">
                  {statusLabel(item.status, t)}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </SettingsCard>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { disconnectIntegrationAction } from "@/features/integrations/actions/disconnect-integration";
import type { WorkspaceIntegrationOAuthState } from "@/features/integrations/queries/get-workspace-integration-oauth-state";
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
  "OAuth connected · messaging soon": "oauthConnected",
  "Preview · authorization only": "oauthTeamsPreview",
  "Not connected": "notConnected",
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
  integrationOAuth,
  canManageOrganization,
}: {
  integrations: SystemStatusItem[];
  integrationOAuth: WorkspaceIntegrationOAuthState;
  canManageOrganization: boolean;
}) {
  const t = useTranslations("settings.integrations");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDisconnect(provider: "slack" | "teams"): void {
    startTransition(async () => {
      const result = await disconnectIntegrationAction({ provider });
      setMessage(result.ok ? t("disconnected") : result.message);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  const oauthProviders = [
    {
      id: "slack" as const,
      label: t("services.slack"),
      state: integrationOAuth.slack,
      connectHref: "/api/integrations/slack/authorize",
    },
    {
      id: "teams" as const,
      label: t("services.microsoftTeams"),
      state: integrationOAuth.teams,
      connectHref: "/api/integrations/teams/authorize",
    },
  ];

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
    <div className="grid gap-6">
      <SettingsCard title={t("oauthTitle")} description={t("oauthDescription")}>
        <ul className="space-y-3">
          {oauthProviders.map((provider) => (
            <li
              key={provider.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3"
            >
              <div>
                <p className="text-sm text-foreground">{provider.label}</p>
                <p className="text-xs text-muted-foreground">
                  {!provider.state.oauthConfigured
                    ? t("oauthNotConfigured")
                    : provider.state.connected
                      ? provider.id === "teams"
                        ? t("oauthTeamsConnectedStatus")
                        : t("oauthConnectedStatus")
                      : t("oauthNotConnectedStatus")}
                </p>
              </div>
              {canManageOrganization && provider.state.oauthConfigured ? (
                provider.state.connected ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDisconnect(provider.id)}
                  >
                    {t("disconnect")}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={provider.connectHref}>{t("connect")}</a>
                  </Button>
                )
              ) : null}
            </li>
          ))}
        </ul>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </SettingsCard>

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
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateNotificationSettingsAction } from "../actions/update-notification-settings";
import type { OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsNotificationsTab({
  settings,
  canManageOrganization,
  emailDeliveryConfigured,
}: {
  settings: OrganizationSettingsDto;
  canManageOrganization: boolean;
  emailDeliveryConfigured: boolean;
}) {
  const t = useTranslations("settings.notifications");
  const tSettings = useTranslations("settings");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState({
    notifySessionCompleted: settings.notifySessionCompleted,
    notifyEmployeeCreated: settings.notifyEmployeeCreated,
    notifyKnowledgeFailed: settings.notifyKnowledgeFailed,
    notifyWeeklyDigest: settings.notifyWeeklyDigest,
  });

  const rows = [
    {
      key: "notifySessionCompleted" as const,
      title: t("sessionCompleted"),
      detail: t("sessionCompletedDetail"),
    },
    {
      key: "notifyEmployeeCreated" as const,
      title: t("employeeCreated"),
      detail: t("employeeCreatedDetail"),
    },
    {
      key: "notifyKnowledgeFailed" as const,
      title: t("knowledgeFailed"),
      detail: t("knowledgeFailedDetail"),
    },
    {
      key: "notifyWeeklyDigest" as const,
      title: t("weeklyDigest"),
      detail: t("weeklyDigestDetail"),
    },
  ];

  return (
    <SettingsCard
      title={t("title")}
      description={t("description")}
      footer={
        <Button
          type="button"
          disabled={!canManageOrganization || isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await updateNotificationSettingsAction(notifications);
              setMessage(
                result.ok ? t("saved") : result.message ?? tSettings("saveFailed"),
              );
            })
          }
        >
          {tSettings("saveChanges")}
        </Button>
      }
    >
      {!emailDeliveryConfigured ? (
        <p className="mb-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
          {t("emailNotConfigured")}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      ) : null}
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3"
          >
            <div>
              <p className="text-sm text-foreground">{row.title}</p>
              <p className="text-xs text-muted-foreground">{row.detail}</p>
            </div>
            <Switch
              checked={notifications[row.key]}
              disabled={!canManageOrganization}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({ ...current, [row.key]: checked }))
              }
            />
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

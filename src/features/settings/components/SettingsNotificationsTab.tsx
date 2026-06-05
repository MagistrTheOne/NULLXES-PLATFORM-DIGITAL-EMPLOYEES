"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateNotificationSettingsAction } from "../actions/update-notification-settings";
import type { OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsNotificationsTab({
  settings,
  canManageOrganization,
}: {
  settings: OrganizationSettingsDto;
  canManageOrganization: boolean;
}) {
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
      title: "Session completed",
      detail: "When a talk session ends in this workspace",
    },
    {
      key: "notifyEmployeeCreated" as const,
      title: "Employee created",
      detail: "When a new digital employee is provisioned",
    },
    {
      key: "notifyKnowledgeFailed" as const,
      title: "Knowledge processing failed",
      detail: "When indexing fails for a knowledge source",
    },
    {
      key: "notifyWeeklyDigest" as const,
      title: "Weekly digest",
      detail: "Summary of workforce activity every Monday",
    },
  ];

  return (
    <SettingsCard
      title="Notification Preferences"
      description="Workspace alerts stored for future delivery channels"
      footer={
        <Button
          type="button"
          disabled={!canManageOrganization || isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await updateNotificationSettingsAction(notifications);
              setMessage(result.ok ? "Notification settings saved." : result.message);
            })
          }
        >
          Save Changes
        </Button>
      }
    >
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

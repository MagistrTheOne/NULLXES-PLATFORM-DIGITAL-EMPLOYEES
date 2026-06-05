"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { exportWorkspaceDataAction } from "../actions/export-workspace-data";
import { requestExportJobAction } from "../actions/request-export-job";
import type { OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsAdvancedTab({
  settings,
  canManageOrganization,
}: {
  settings: OrganizationSettingsDto;
  canManageOrganization: boolean;
}) {
  const t = useTranslations("settings.advanced");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAsyncExport(): void {
    startTransition(async () => {
      const result = await requestExportJobAction();
      setMessage(
        result.ok
          ? t("queued", { jobId: result.jobId.slice(0, 8) })
          : result.message,
      );
    });
  }

  function handleExport(): void {
    startTransition(async () => {
      const result = await exportWorkspaceDataAction();

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      const blob = new Blob([result.payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nullxes-workspace-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(t("downloaded"));
    });
  }

  return (
    <div className="grid gap-6">
      <SettingsCard title={t("title")} description={t("description")}>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!canManageOrganization || isPending}
            onClick={handleExport}
          >
            {t("exportNow")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canManageOrganization || isPending}
            onClick={handleAsyncExport}
          >
            {t("queueExport")}
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </SettingsCard>
      <SettingsCard title={t("title")}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            {settings.sessionRetentionDays} / {settings.retentionPolicyDays}
          </p>
        </div>
      </SettingsCard>
    </div>
  );
}

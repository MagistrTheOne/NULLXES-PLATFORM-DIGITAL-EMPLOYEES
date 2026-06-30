"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { closeOpenSessionsAction } from "../actions/close-open-sessions";
import { exportWorkspaceDataAction } from "../actions/export-workspace-data";
import { requestExportJobAction } from "../actions/request-export-job";
import type { OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsAdvancedTab({
  settings,
  canManageOrganization,
  isPlatformAdmin,
  openSessionCount,
}: {
  settings: OrganizationSettingsDto;
  canManageOrganization: boolean;
  isPlatformAdmin: boolean;
  openSessionCount: number;
}) {
  const t = useTranslations("settings.advanced");
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAsyncExport(): void {
    setDownloadUrl(null);
    startTransition(async () => {
      const result = await requestExportJobAction();
      if (result.ok) {
        setMessage(t("queued", { jobId: result.jobId.slice(0, 8) }));
        setDownloadUrl(`/api/settings/export/${result.jobId}`);
      } else {
        setMessage(result.message);
      }
    });
  }

  function handleExport(): void {
    setDownloadUrl(null);
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

  function handleStopSessions(): void {
    startTransition(async () => {
      const result = await closeOpenSessionsAction();
      setMessage(
        result.ok
          ? t("sessionsStopped", { count: result.closedCount })
          : result.message,
      );
      if (result.ok) {
        router.refresh();
      }
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
        {message ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {message}
            {downloadUrl ? (
              <>
                {" "}
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline underline-offset-4"
                >
                  {t("download")}
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </SettingsCard>

      {isPlatformAdmin ? (
        <SettingsCard
          title={t("sessionsTitle")}
          description={t("sessionsDescription")}
        >
          <p className="text-sm text-muted-foreground">
            {t("openSessions", { count: openSessionCount })}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending || openSessionCount === 0}
              onClick={handleStopSessions}
            >
              {t("stopSessions")}
            </Button>
          </div>
        </SettingsCard>
      ) : null}

      <SettingsCard title={t("retentionTitle")}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            {settings.sessionRetentionDays} / {settings.retentionPolicyDays}
          </p>
        </div>
      </SettingsCard>
    </div>
  );
}

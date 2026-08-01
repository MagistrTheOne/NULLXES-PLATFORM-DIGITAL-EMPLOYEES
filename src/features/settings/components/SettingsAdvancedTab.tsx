"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteOrganizationDataAction } from "@/features/security/actions/delete-organization-data";
import { closeOpenSessionsAction } from "../actions/close-open-sessions";
import { exportWorkspaceDataAction } from "../actions/export-workspace-data";
import { getExportJobStatusAction } from "../actions/get-export-job-status";
import { requestExportJobAction } from "../actions/request-export-job";
import type { OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

type ExportPhase = "idle" | "queued" | "processing" | "ready" | "failed";

export function SettingsAdvancedTab({
  settings,
  organizationName,
  canManageOrganization,
  isPlatformAdmin,
  openSessionCount,
}: {
  settings: OrganizationSettingsDto;
  organizationName: string;
  canManageOrganization: boolean;
  isPlatformAdmin: boolean;
  openSessionCount: number;
}) {
  const t = useTranslations("settings.advanced");
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [orgMessage, setOrgMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportPhase, setExportPhase] = useState<ExportPhase>("idle");
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [deleteOrgConfirm, setDeleteOrgConfirm] = useState("");
  const [isPending, startTransition] = useTransition();
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pollingJobId) {
      return;
    }

    let cancelled = false;

    async function poll(): Promise<void> {
      const result = await getExportJobStatusAction(pollingJobId!);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setExportPhase("failed");
        setMessage(result.message);
        setPollingJobId(null);
        return;
      }

      if (result.status === "pending") {
        setExportPhase("queued");
        setMessage(t("exportPending"));
        return;
      }

      if (result.status === "processing") {
        setExportPhase("processing");
        setMessage(t("exportProcessing"));
        return;
      }

      if (result.status === "ready" && result.downloadUrl) {
        setExportPhase("ready");
        setDownloadUrl(result.downloadUrl);
        setMessage(t("exportReady"));
        setPollingJobId(null);
        return;
      }

      setExportPhase("failed");
      setDownloadUrl(null);
      setMessage(result.errorMessage ?? t("exportFailed"));
      setPollingJobId(null);
    }

    void poll();
    pollTimerRef.current = setInterval(() => {
      void poll();
    }, 2500);

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [pollingJobId, t]);

  function handleAsyncExport(): void {
    setDownloadUrl(null);
    setExportPhase("queued");
    startTransition(async () => {
      const result = await requestExportJobAction();
      if (result.ok) {
        setMessage(t("queued", { jobId: result.jobId.slice(0, 8) }));
        setPollingJobId(result.jobId);
      } else {
        setExportPhase("failed");
        setMessage(result.message);
      }
    });
  }

  function handleExport(): void {
    setDownloadUrl(null);
    setExportPhase("idle");
    setPollingJobId(null);
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

  function handleDeleteOrganization(): void {
    startTransition(async () => {
      const result = await deleteOrganizationDataAction();
      if (!result.ok) {
        setOrgMessage(result.message);
        return;
      }

      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <SettingsCard title={t("title")} description={t("description")}>
        <p className="mb-3 text-sm text-muted-foreground">{t("exportSizeNote")}</p>
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
            disabled={!canManageOrganization || isPending || Boolean(pollingJobId)}
            onClick={handleAsyncExport}
          >
            {t("queueExport")}
          </Button>
          {exportPhase === "ready" && downloadUrl ? (
            <Button type="button" asChild>
              <a href={downloadUrl} rel="noreferrer">
                {t("download")}
              </a>
            </Button>
          ) : null}
        </div>
        {message ? (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
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

      <SettingsCard title={t("retentionTitle")} description={t("retentionDescription")}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            {t("sessionRetentionDays", {
              days: settings.sessionRetentionDays,
            })}
          </p>
          <p>
            {t("retentionPolicyDays", {
              days: settings.retentionPolicyDays,
            })}
          </p>
        </div>
      </SettingsCard>

      {canManageOrganization ? (
        <SettingsCard
          title={t("deleteOrgTitle")}
          description={t("deleteOrgDescription")}
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                {t("deleteOrgButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteOrgDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteOrgDialogDescription", { name: organizationName })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteOrgConfirm}
                onChange={(event) => setDeleteOrgConfirm(event.target.value)}
                placeholder={organizationName}
                className="mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteOrgConfirm("")}>
                  {t("deleteOrgCancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={
                    deleteOrgConfirm.trim() !== organizationName.trim() ||
                    isPending
                  }
                  onClick={handleDeleteOrganization}
                >
                  {t("deleteOrgConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {orgMessage ? (
            <p className="mt-3 text-sm text-muted-foreground">{orgMessage}</p>
          ) : null}
        </SettingsCard>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
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
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAsyncExport(): void {
    startTransition(async () => {
      const result = await requestExportJobAction();
      setMessage(
        result.ok
          ? `Export job queued (${result.jobId.slice(0, 8)}…). Download link when ready.`
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
      setMessage("Workspace export downloaded.");
    });
  }

  return (
    <div className="grid gap-6">
      <SettingsCard title="Data Export">
        <p className="mb-4 text-sm text-muted-foreground">
          Download organization settings, usage snapshot, and team metadata as JSON.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!canManageOrganization || isPending}
            onClick={handleExport}
          >
            Export Now (JSON)
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canManageOrganization || isPending}
            onClick={handleAsyncExport}
          >
            Queue Background Export
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </SettingsCard>
      <SettingsCard title="Retention Controls">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Session retention: {settings.sessionRetentionDays} days</p>
          <p>Data retention policy: {settings.retentionPolicyDays} days</p>
          <p>Adjust these values in General and Data & Privacy.</p>
        </div>
      </SettingsCard>
    </div>
  );
}

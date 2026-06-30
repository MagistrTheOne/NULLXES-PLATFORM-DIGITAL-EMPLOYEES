"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { resolveApprovalAction } from "@/features/agent-approval/actions/resolve-approval";
import type { PendingApprovalRow } from "@/features/agent-approval/queries/list-pending-approvals";
import { formatRelativeTime } from "@/features/overview/lib/format-relative-time";
import { SettingsCard } from "./settings-card";

export function SettingsApprovalsSection({
  approvals,
  canManageOrganization,
}: {
  approvals: PendingApprovalRow[];
  canManageOrganization: boolean;
}) {
  const t = useTranslations("settings.approvals");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleResolve(approvalId: string, decision: "approved" | "rejected") {
    startTransition(async () => {
      await resolveApprovalAction({ approvalId, decision });
      router.refresh();
    });
  }

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      {approvals.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {approvals.map((approval) => (
            <li
              key={approval.id}
              className="rounded-lg border border-border bg-background/40 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{approval.actionType}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {approval.employeeName}
                    {" · "}
                    {formatRelativeTime(approval.createdAt, locale)}
                  </p>
                </div>
                {canManageOrganization ? (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleResolve(approval.id, "rejected")}
                    >
                      {t("reject")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleResolve(approval.id, "approved")}
                    >
                      {t("approve")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}

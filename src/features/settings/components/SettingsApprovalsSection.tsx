"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { resolveApprovalAction } from "@/features/agent-approval/actions/resolve-approval";
import type { PendingApprovalRow } from "@/features/agent-approval/queries/list-pending-approvals";
import { formatRelativeTime } from "@/features/overview/lib/format-relative-time";
import { SettingsCard } from "./settings-card";

function summarizePayload(
  actionType: string,
  payload: Record<string, unknown>,
): string | null {
  if (actionType === "draft_email") {
    const to = typeof payload.to === "string" ? payload.to : "";
    const subject = typeof payload.subject === "string" ? payload.subject : "";
    const body = typeof payload.body === "string" ? payload.body : "";
    const parts = [
      to ? `To: ${to}` : null,
      subject ? `Subject: ${subject}` : null,
      body ? body.slice(0, 220) + (body.length > 220 ? "…" : "") : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  if (actionType === "mission_proposals") {
    const title = typeof payload.title === "string" ? payload.title : null;
    const leadCount =
      typeof payload.leadCount === "number" ? payload.leadCount : null;
    const preview = Array.isArray(payload.preview)
      ? payload.preview
          .slice(0, 3)
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null;
            }
            const row = item as Record<string, unknown>;
            const company =
              typeof row.companyName === "string" ? row.companyName : null;
            const email =
              typeof row.contactEmail === "string" ? row.contactEmail : null;
            return [company, email].filter(Boolean).join(" · ") || null;
          })
          .filter(Boolean)
          .join("; ")
      : null;
    const parts = [
      title,
      leadCount != null ? `${leadCount} leads` : null,
      preview || null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  if (
    actionType === "cancel_mission" ||
    actionType === "restart_mission" ||
    actionType === "destructive_action"
  ) {
    const reason =
      typeof payload.reason === "string"
        ? payload.reason
        : typeof payload.summary === "string"
          ? payload.summary
          : null;
    const missionId =
      typeof payload.missionId === "string" ? payload.missionId.slice(0, 8) : null;
    const parts = [
      missionId ? `mission ${missionId}…` : null,
      reason ? reason.slice(0, 180) : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return null;
  }
  try {
    const raw = JSON.stringify(payload);
    return raw.length > 240 ? `${raw.slice(0, 240)}…` : raw;
  } catch {
    return null;
  }
}

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

  function actionLabel(actionType: string): string {
    const known = [
      "cancel_mission",
      "restart_mission",
      "draft_email",
      "mission_proposals",
      "destructive_action",
    ] as const;
    if ((known as readonly string[]).includes(actionType)) {
      return t(`actionTypes.${actionType as (typeof known)[number]}`);
    }
    return actionType;
  }

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      {approvals.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {approvals.map((approval) => {
            const summary = summarizePayload(
              approval.actionType,
              approval.payload,
            );
            return (
              <li
                key={approval.id}
                className="rounded-lg border border-border bg-background/40 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      {actionLabel(approval.actionType)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {approval.employeeName}
                      {" · "}
                      {formatRelativeTime(approval.createdAt, locale)}
                    </p>
                    {summary ? (
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-white/55">
                        {summary}
                      </p>
                    ) : null}
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
            );
          })}
        </ul>
      )}
    </SettingsCard>
  );
}

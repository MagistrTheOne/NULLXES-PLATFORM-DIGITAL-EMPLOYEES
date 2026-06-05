"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import { createBillingPortalSessionAction } from "@/features/billing/actions/create-billing-portal-session";
import type { OrganizationProfileDto, SettingsUsageSnapshot } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsBillingTab({
  organization,
  usage,
  canManageOrganization,
}: {
  organization: OrganizationProfileDto;
  usage: SettingsUsageSnapshot;
  canManageOrganization: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const planLabel =
    organization.type === "enterprise"
      ? "Enterprise"
      : organization.type === "government"
        ? "Government"
        : "Demo";

  function openPortal(): void {
    startTransition(async () => {
      const result = await createBillingPortalSessionAction();
      if (result.ok) {
        window.location.href = result.url;
      }
    });
  }

  return (
    <div className="grid gap-6">
      <SettingsCard title="Current Plan" description="Workspace subscription tier">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-4">
            <p className="text-2xl font-medium text-foreground">{planLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Stripe Customer Portal for invoices and payment methods.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Unlimited digital employees</li>
            <li>Workspace analytics and audit trail</li>
            <li>Knowledge indexing and session retention controls</li>
          </ul>
        </div>
      </SettingsCard>
      <SettingsCard title="Usage Meters" description="Billable workspace activity">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-xl font-medium text-foreground">{usage.totalSessions}</p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Talk time</p>
            <p className="text-xl font-medium text-foreground">
              {formatDurationSeconds(usage.totalConversationSeconds)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Messages</p>
            <p className="text-xl font-medium text-foreground">{usage.totalMessages}</p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Knowledge sources</p>
            <p className="text-xl font-medium text-foreground">
              {usage.totalKnowledgeSources}
            </p>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard title="Payment Methods">
        <p className="mb-4 text-sm text-muted-foreground">
          Manage cards and invoices in Stripe. Requires STRIPE_SECRET_KEY.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={!canManageOrganization || isPending}
          onClick={openPortal}
        >
          Open Stripe Customer Portal
        </Button>
      </SettingsCard>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import {
  BILLING_PLANS,
  getPolarProductId,
  type BillingPlanId,
} from "@/features/billing/config/plans";
import { buildPolarCheckoutUrl } from "@/features/billing/lib/build-checkout-url";
import { isPolarConfigured } from "@/features/billing/services/polar-config";
import type { OrganizationProfileDto, SettingsUsageSnapshot } from "../types";
import { SettingsCard } from "./settings-card";

function resolveActivePlanId(billingPlan: string): BillingPlanId {
  if (
    billingPlan === "free" ||
    billingPlan === "super_pro" ||
    billingPlan === "enterprise" ||
    billingPlan === "government"
  ) {
    return billingPlan;
  }

  return "free";
}

export function SettingsBillingTab({
  organization,
  usage,
  canManageOrganization,
}: {
  organization: OrganizationProfileDto;
  usage: SettingsUsageSnapshot;
  canManageOrganization: boolean;
}) {
  const planId = resolveActivePlanId(organization.billingPlan);
  const activePlan = BILLING_PLANS[planId];
  const polarReady = isPolarConfigured();
  const superProProductId = getPolarProductId("super_pro");

  const checkoutUrl =
    superProProductId && polarReady
      ? buildPolarCheckoutUrl({
          productId: superProProductId,
          organizationId: organization.id,
        })
      : null;

  return (
    <div className="grid gap-6">
      <SettingsCard
        title="Current Plan"
        description="Premium digital workforce operations"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-4">
            <p className="text-2xl font-medium text-foreground">
              {activePlan.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activePlan.priceLabel} · {activePlan.description}
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {activePlan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </SettingsCard>

      <SettingsCard title="Plans" description="NULLXES premium tiers">
        <div className="grid gap-3">
          {Object.values(BILLING_PLANS).map((plan) => {
            const isCurrent = plan.id === planId;
            const productId =
              plan.id === "super_pro" ? superProProductId : undefined;
            const canCheckout =
              plan.checkoutEnabled &&
              canManageOrganization &&
              polarReady &&
              productId;

            return (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {plan.name}
                    {isCurrent ? (
                      <span className="ms-2 text-xs text-muted-foreground">
                        Current
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.priceLabel}
                  </p>
                </div>
                {canCheckout && checkoutUrl && plan.id === "super_pro" ? (
                  <Button
                    type="button"
                    className="bg-foreground text-background hover:bg-foreground/90"
                    asChild
                  >
                    <Link href={checkoutUrl}>Upgrade</Link>
                  </Button>
                ) : plan.id === "enterprise" || plan.id === "government" ? (
                  <Button type="button" variant="outline" asChild>
                    <a href="mailto:sales@nullxes.com">Contact sales</a>
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Usage Meters" description="Billable workspace activity">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-xl font-medium text-foreground">
              {usage.totalSessions}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Talk time</p>
            <p className="text-xl font-medium text-foreground">
              {formatDurationSeconds(usage.totalConversationSeconds)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Messages</p>
            <p className="text-xl font-medium text-foreground">
              {usage.totalMessages}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Knowledge sources</p>
            <p className="text-xl font-medium text-foreground">
              {usage.totalKnowledgeSources}
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Customer Portal">
        <p className="mb-4 text-sm text-muted-foreground">
          Manage subscriptions, invoices, and payment methods in Polar.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={!canManageOrganization || !polarReady}
          asChild={canManageOrganization && polarReady}
        >
          {canManageOrganization && polarReady ? (
            <Link href="/api/portal">Open Polar Customer Portal</Link>
          ) : (
            <span>Open Polar Customer Portal</span>
          )}
        </Button>
      </SettingsCard>
    </div>
  );
}

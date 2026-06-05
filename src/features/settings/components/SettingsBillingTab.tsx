"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import {
  BILLING_PLANS,
  getPolarProductId,
} from "@/features/billing/config/plans";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { buildPolarCheckoutUrl } from "@/features/billing/lib/build-checkout-url";
import { isPolarConfigured } from "@/features/billing/services/polar-config";
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
  const t = useTranslations("settings.billing");
  const planId = resolveBillingPlanId(organization.billingPlan);
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
      <SettingsCard title={t("currentPlan")} description={t("currentPlanDesc")}>
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

      <SettingsCard title={t("plans")} description={t("plansDesc")}>
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
                        {t("current")}
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
                    <Link href={checkoutUrl}>{t("upgrade")}</Link>
                  </Button>
                ) : plan.id === "enterprise" || plan.id === "government" ? (
                  <Button type="button" variant="outline" asChild>
                    <a href="mailto:sales@nullxes.com">{t("contactSales")}</a>
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title={t("usageMeters")} description={t("usageMetersDesc")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("sessions")}</p>
            <p className="text-xl font-medium text-foreground">
              {usage.totalSessions}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("talkTime")}</p>
            <p className="text-xl font-medium text-foreground">
              {formatDurationSeconds(usage.totalConversationSeconds)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("messages")}</p>
            <p className="text-xl font-medium text-foreground">
              {usage.totalMessages}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("knowledgeSources")}</p>
            <p className="text-xl font-medium text-foreground">
              {usage.totalKnowledgeSources}
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t("customerPortal")}>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("customerPortalDesc")}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={!canManageOrganization || !polarReady}
          asChild={canManageOrganization && polarReady}
        >
          {canManageOrganization && polarReady ? (
            <Link href="/api/portal">{t("openPortal")}</Link>
          ) : (
            <span>{t("openPortal")}</span>
          )}
        </Button>
      </SettingsCard>
    </div>
  );
}

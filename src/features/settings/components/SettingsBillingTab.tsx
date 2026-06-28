"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import {
  BILLING_PLANS,
  getPolarProductId,
} from "@/features/billing/config/plans";
import {
  getFlagshipPricingTier,
  getGridPricingTiers,
  resolvePricingTierIdForPlan,
  type PricingTier,
} from "@/features/billing/config/pricing-tiers";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { buildPolarCheckoutUrl } from "@/features/billing/lib/build-checkout-url";
import { isPolarConfigured } from "@/features/billing/services/polar-config";
import type { OrganizationProfileDto, SettingsUsageSnapshot } from "../types";
import { SettingsCard } from "./settings-card";

const SALES_CONTACT = "mailto:sales@nullxes.com";
const FOUNDERS_CONTACT = "mailto:founders@nullxes.com";

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
  const currentTierId = resolvePricingTierIdForPlan(planId);
  const polarReady = isPolarConfigured();
  const superProProductId = getPolarProductId("super_pro");

  const checkoutUrl =
    superProProductId && polarReady
      ? buildPolarCheckoutUrl({
          productId: superProProductId,
          organizationId: organization.id,
        })
      : null;

  const gridTiers = getGridPricingTiers();
  const flagshipTier = getFlagshipPricingTier();

  function renderTierCta(tier: PricingTier): React.ReactNode {
    const isCurrent = tier.id === currentTierId;

    if (isCurrent) {
      return (
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full justify-center border-border bg-transparent text-muted-foreground"
        >
          {t("currentPlanCta")}
        </Button>
      );
    }

    if (tier.id === "super_pro") {
      if (canManageOrganization && polarReady && checkoutUrl) {
        return (
          <Button
            type="button"
            className="w-full justify-center bg-foreground text-background hover:bg-foreground/90"
            asChild
          >
            <Link href={checkoutUrl}>{t("upgrade")}</Link>
          </Button>
        );
      }
      return (
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full justify-center border-border bg-transparent text-muted-foreground"
        >
          {t("upgrade")}
        </Button>
      );
    }

    if (tier.id === "free") {
      return (
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full justify-center border-border bg-transparent text-muted-foreground"
        >
          {t("included")}
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center border-border bg-transparent text-foreground hover:bg-accent"
        asChild
      >
        <a href={SALES_CONTACT}>{t("contactSales")}</a>
      </Button>
    );
  }

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gridTiers.map((tier) => {
            const isCurrent = tier.id === currentTierId;

            return (
              <div
                key={tier.id}
                className={cn(
                  "flex h-full flex-col rounded-2xl border bg-background/40 p-5 transition-colors",
                  isCurrent
                    ? "border-foreground/40 ring-1 ring-foreground/15"
                    : "border-border hover:border-foreground/20",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {tier.name}
                  </p>
                  {isCurrent ? (
                    <span className="rounded-full border border-foreground/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/70">
                      {t("current")}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-medium tracking-tight text-foreground">
                    {tier.priceLabel}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {tier.priceNote}
                  </p>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {tier.description}
                </p>

                <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4 text-sm text-foreground/80">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/40" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">{renderTierCta(tier)}</div>
              </div>
            );
          })}
        </div>

        {flagshipTier ? (
          <div className="mt-3 flex flex-col gap-5 rounded-2xl border border-foreground/20 bg-background/40 p-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("flagship")}
              </p>
              <p className="mt-2 text-xl font-medium tracking-tight text-foreground">
                {flagshipTier.name} · {t("digitalCorporation")}
              </p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {flagshipTier.description}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {flagshipTier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1.5">
                    <Check className="size-3 shrink-0 text-foreground/40" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
              <p className="text-2xl font-medium tracking-tight text-foreground">
                {flagshipTier.priceLabel}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {flagshipTier.priceNote}
              </p>
              <Button
                type="button"
                className="bg-foreground text-background hover:bg-foreground/90"
                asChild
              >
                <a href={FOUNDERS_CONTACT}>{t("talkToFounders")}</a>
              </Button>
            </div>
          </div>
        ) : null}
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

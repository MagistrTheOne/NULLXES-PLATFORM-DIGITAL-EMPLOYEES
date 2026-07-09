"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import {
  BILLING_PLANS,
  type BillingInterval,
} from "@/features/billing/config/plans";
import {
  getBillingPlanDisplay,
  resolveEffectiveBillingPlanId,
  resolveTierPriceDisplay,
} from "@/features/billing/lib/billing-plan-helpers";
import {
  getFlagshipPricingTier,
  getSalesPricingTiers,
  getSelfServePricingTiers,
  resolvePricingTierIdForPlan,
  type PricingTier,
  type PricingTierId,
} from "@/features/billing/config/pricing-tiers";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import type {
  BillingSnapshot,
  OrganizationProfileDto,
  SettingsUsageSnapshot,
} from "../types";
import { SettingsCard } from "./settings-card";

const SALES_CONTACT = "mailto:ceo@nullxes.com";
const FOUNDERS_CONTACT = "mailto:founders@nullxes.com";

const TIER_TO_CHECKOUT_PLAN: Partial<
  Record<PricingTierId, "studio" | "operator" | "scale">
> = {
  studio: "studio",
  operator: "operator",
  scale: "scale",
};

function formatRenewalDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(isoDate));
}

export function SettingsBillingTab({
  organization,
  usage,
  canManageOrganization,
  billing,
}: {
  organization: OrganizationProfileDto;
  usage: SettingsUsageSnapshot;
  canManageOrganization: boolean;
  billing: BillingSnapshot;
}) {
  const t = useTranslations("settings.billing");
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");

  const dbPlanId = resolveBillingPlanId(organization.billingPlan);
  const planId = resolveEffectiveBillingPlanId({
    dbPlanId,
    subscription: billing.subscription,
  });
  const activePlan = BILLING_PLANS[planId];
  const currentTierId = resolvePricingTierIdForPlan(planId);
  const polarReady = billing.polarReady;

  const polarCatalogProduct = billing.polarCatalog.find(
    (product) =>
      product.planId === planId &&
      (product.recurringInterval === billingInterval ||
        product.recurringInterval == null),
  );
  const currentPlanDisplay = getBillingPlanDisplay({
    planId,
    polarProductName:
      billing.subscription && polarCatalogProduct
        ? polarCatalogProduct.name
        : null,
    polarPriceLabel:
      billing.subscription?.priceLabel ??
      polarCatalogProduct?.priceLabel ??
      null,
  });

  const selfServeTiers = getSelfServePricingTiers();
  const salesTiers = getSalesPricingTiers();
  const flagshipTier = getFlagshipPricingTier();

  function checkoutUrlForTier(tier: PricingTier): string | null {
    const planKey = TIER_TO_CHECKOUT_PLAN[tier.id];
    if (!planKey) return null;
    const byInterval = billing.selfServeCheckoutUrls?.[planKey];
    return (
      byInterval?.[billingInterval] ??
      byInterval?.month ??
      byInterval?.year ??
      (tier.id === "scale" ? billing.superProCheckoutUrl : null) ??
      billing.checkoutUrl ??
      null
    );
  }

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

    if (tier.engagement === "self_serve") {
      const checkoutUrl = checkoutUrlForTier(tier);
      if (canManageOrganization && polarReady && checkoutUrl) {
        return (
          <Button
            type="button"
            className="w-full justify-center bg-foreground text-background hover:bg-foreground/90"
            asChild
          >
            <Link href={checkoutUrl}>{t("launchEmployee")}</Link>
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

  function renderTierGrid(tiers: PricingTier[], withInterval: boolean) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => {
          const isCurrent = tier.id === currentTierId;
          const price = withInterval
            ? resolveTierPriceDisplay({
                catalog: billing.polarCatalog,
                tierId: tier.id,
                interval: billingInterval,
                fallbackTier: tier,
              })
            : {
                priceLabel: tier.priceLabel,
                priceNote: tier.priceNote,
              };

          return (
            <div
              key={tier.id}
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-background/40 p-5 transition-colors",
                isCurrent
                  ? "border-foreground/40 ring-1 ring-foreground/15"
                  : tier.recommended
                    ? "border-foreground/25"
                    : "border-border hover:border-foreground/20",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {tier.name}
                </p>
                <div className="flex flex-wrap justify-end gap-1">
                  {tier.recommended && !isCurrent ? (
                    <span className="rounded-full border border-foreground/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/70">
                      {t("recommended")}
                    </span>
                  ) : null}
                  {isCurrent ? (
                    <span className="rounded-full border border-foreground/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/70">
                      {t("current")}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-2xl font-medium tracking-tight text-foreground">
                  {price.priceLabel}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {price.priceNote}
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
    );
  }

  return (
    <div className="grid gap-6">
      <SettingsCard
        title={t("designPartners")}
        description={t("designPartnersDesc")}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("designPartnersBody")}
          </p>
          <Button
            type="button"
            className="shrink-0 bg-foreground text-background hover:bg-foreground/90"
            asChild
          >
            <a href={SALES_CONTACT}>{t("applyDesignPartner")}</a>
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title={t("currentPlan")} description={t("currentPlanDesc")}>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-medium text-foreground">
                {currentPlanDisplay.name}
              </p>
              {billing.planSource === "manual" ? (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("manualPlan")}
                </span>
              ) : null}
              {billing.planSource === "polar" ? (
                <span className="rounded-full border border-foreground/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/70">
                  {t("polarSubscription")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPlanDisplay.priceLabel}
              {billing.subscription?.priceNote
                ? ` · ${billing.subscription.priceNote}`
                : null}{" "}
              · {currentPlanDisplay.description}
            </p>
            {billing.subscription ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {billing.subscription.cancelAtPeriodEnd
                  ? t("cancelsOn", {
                      date: formatRenewalDate(
                        billing.subscription.currentPeriodEnd,
                      ),
                    })
                  : t("renewsOn", {
                      date: formatRenewalDate(
                        billing.subscription.currentPeriodEnd,
                      ),
                    })}
              </p>
            ) : null}
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {activePlan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </SettingsCard>

      <SettingsCard title={t("selfServe")} description={t("selfServeDesc")}>
        {!polarReady ? (
          <p className="mb-4 text-sm text-muted-foreground">
            {t("polarNotConfigured")}
          </p>
        ) : billing.selfServeLiveCount >= 6 ? (
          <p className="mb-4 text-sm text-muted-foreground">
            {t("polarPricesLive")}
          </p>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">
            {t("polarPricesPending", {
              count: billing.selfServeLiveCount,
            })}
          </p>
        )}

        <div
          className="mb-4 inline-flex rounded-full border border-border bg-background/40 p-1"
          role="group"
          aria-label={t("billingInterval")}
        >
          <button
            type="button"
            onClick={() => setBillingInterval("month")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              billingInterval === "month"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("billingIntervalMonthly")}
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("year")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              billingInterval === "year"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("billingIntervalAnnual")}
          </button>
        </div>

        {renderTierGrid(selfServeTiers, true)}
      </SettingsCard>

      {canManageOrganization && billing.verificationCheckoutUrl ? (
        <SettingsCard
          title={t("paymentTest")}
          description={t("paymentTestDesc")}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-2xl font-medium tracking-tight text-foreground">
                $1
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("paymentTestBody")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-border bg-transparent text-foreground hover:bg-accent"
              asChild
            >
              <Link href={billing.verificationCheckoutUrl}>
                {t("paymentTestCta")}
              </Link>
            </Button>
          </div>
        </SettingsCard>
      ) : null}

      <SettingsCard title={t("enterpriseLadder")} description={t("enterpriseLadderDesc")}>
        {renderTierGrid(salesTiers, false)}

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
          disabled={!billing.portalEnabled}
          asChild={billing.portalEnabled}
        >
          {billing.portalEnabled ? (
            <Link href="/api/portal">{t("openPortal")}</Link>
          ) : (
            <span>{t("openPortal")}</span>
          )}
        </Button>
      </SettingsCard>
    </div>
  );
}

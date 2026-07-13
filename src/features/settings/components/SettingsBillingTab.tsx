"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
} from "@/features/billing/lib/billing-plan-helpers";
import {
  getFlagshipPricingTier,
  getSalesPricingTiers,
  getSelfServePricingTiers,
  resolvePricingTierIdForPlan,
  type PricingTier,
  type PricingTierId,
} from "@/features/billing/config/pricing-tiers";
import { getRubTierPrice } from "@/features/billing/config/rub-pricing";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import type {
  BillingSnapshot,
  OrganizationProfileDto,
  SettingsUsageSnapshot,
} from "../types";
import { SettingsCard } from "./settings-card";
import { TbankPayButton } from "@/features/billing/tbank/tbank-pay-button";

const SALES_CONTACT = "mailto:ceo@nullxes.com";
const FOUNDERS_CONTACT = "mailto:founders@nullxes.com";

function formatRenewalDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
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
  const locale = useLocale();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");

  const dbPlanId = resolveBillingPlanId(organization.billingPlan);
  const planId = resolveEffectiveBillingPlanId({
    dbPlanId,
    subscription: billing.subscription,
  });
  const activePlan = BILLING_PLANS[planId];
  const currentTierId = resolvePricingTierIdForPlan(planId);
  const tbankReady = billing.tbank.ready;

  const currentPlanDisplay = getBillingPlanDisplay({
    planId,
    polarProductName: null,
    polarPriceLabel: null,
  });

  const selfServeTiers = getSelfServePricingTiers();
  const salesTiers = getSalesPricingTiers();
  const flagshipTier = getFlagshipPricingTier();

  function tierName(id: PricingTierId, fallback: string): string {
    const key = `tier.${id}.name` as const;
    return t.has(key) ? t(key) : fallback;
  }

  function tierDescription(id: PricingTierId, fallback: string): string {
    const key = `tier.${id}.description` as const;
    return t.has(key) ? t(key) : fallback;
  }

  function tierFeatures(id: PricingTierId, fallback: string[]): string[] {
    const key = `tier.${id}.features` as const;
    if (!t.has(key)) return fallback;
    return t(key)
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function resolveDisplayPrice(tier: PricingTier): {
    priceLabel: string;
    priceNote: string;
  } {
    const rub = getRubTierPrice(tier.id, billingInterval, locale);
    if (rub) {
      const note =
        rub.priceNoteKey === "rfNoCard"
          ? t("rfNoCard")
          : rub.priceNoteKey === "perMonth"
            ? t("priceNoteMonth")
            : t("priceNoteYear");
      return { priceLabel: rub.priceLabel, priceNote: note };
    }

    if (tier.engagement === "sales") {
      return {
        priceLabel: t("rfSalesPriceNote"),
        priceNote: "",
      };
    }

    return {
      priceLabel: t("contactSales"),
      priceNote: t("rfSalesPriceNote"),
    };
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
      if (
        canManageOrganization &&
        tbankReady &&
        (tier.id === "starter" ||
          tier.id === "studio" ||
          tier.id === "operator" ||
          tier.id === "scale")
      ) {
        return (
          <TbankPayButton
            label={t("subscribe")}
            planId={tier.id}
            interval={billingInterval}
            pendingLabel={t("subscribePending")}
            className="w-full justify-center border-border bg-foreground text-background hover:bg-foreground/90"
          />
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

  function renderTierGrid(
    tiers: PricingTier[],
    columns: "self_serve" | "sales" = "sales",
  ) {
    return (
      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2",
          columns === "self_serve" ? "lg:grid-cols-5" : "lg:grid-cols-4",
        )}
      >
        {tiers.map((tier) => {
          const isCurrent = tier.id === currentTierId;
          const showPrice = tier.engagement !== "sales";
          const price = showPrice ? resolveDisplayPrice(tier) : null;
          const features = tierFeatures(tier.id, tier.features);

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
                  {tierName(tier.id, tier.name)}
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

              {price ? (
                <div className="mt-4">
                  <p className="text-2xl font-medium tracking-tight text-foreground">
                    {price.priceLabel}
                  </p>
                  {price.priceNote ? (
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {price.priceNote}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <p
                className={cn(
                  "text-sm text-muted-foreground",
                  price ? "mt-3" : "mt-4",
                )}
              >
                {tierDescription(tier.id, tier.description)}
              </p>

              <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4 text-sm text-foreground/80">
                {features.map((feature) => (
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
      <SettingsCard title={t("currentPlan")} description={t("currentPlanDesc")}>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-4">
            <p className="text-2xl font-medium text-foreground">
              {currentTierId
                ? tierName(currentTierId, currentPlanDisplay.name)
                : currentPlanDisplay.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentTierId
                ? tierDescription(currentTierId, currentPlanDisplay.description)
                : currentPlanDisplay.description}
            </p>
            {billing.subscription ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {billing.subscription.cancelAtPeriodEnd
                  ? t("cancelsOn", {
                      date: formatRenewalDate(
                        billing.subscription.currentPeriodEnd,
                        locale,
                      ),
                    })
                  : t("renewsOn", {
                      date: formatRenewalDate(
                        billing.subscription.currentPeriodEnd,
                        locale,
                      ),
                    })}
              </p>
            ) : null}
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(currentTierId
              ? tierFeatures(currentTierId, activePlan.features)
              : activePlan.features
            ).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </SettingsCard>

      <SettingsCard title={t("selfServe")} description={t("selfServeDesc")}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-full border border-border bg-background/40 p-1"
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
          <p className="text-xs text-muted-foreground">
            {t("billingIntervalAnnualSave")}
          </p>
        </div>

        {renderTierGrid(selfServeTiers, "self_serve")}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-xl border-collapse text-left text-sm">
            <caption className="sr-only">{t("planLadder")}</caption>
            <thead>
              <tr className="border-b border-border bg-background/60">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                  {t("planLadderCapability")}
                </th>
                {(["starter", "studio", "operator", "scale"] as const).map(
                  (id) => (
                    <th
                      key={id}
                      className="px-3 py-3 text-xs font-medium text-foreground"
                    >
                      {tierName(id, id)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {(
                [
                  {
                    label: t("planLadderAvatar"),
                    cells: [
                      t("planLadderYes"),
                      t("planLadderYes"),
                      t("planLadderYes"),
                      t("planLadderYes"),
                    ],
                  },
                  {
                    label: t("planLadderKnowledge"),
                    cells: [
                      t("planLadderKnowledgeBasic"),
                      t("planLadderKnowledgeExpanded"),
                      t("planLadderKnowledgeShared"),
                      t("planLadderKnowledgeExpanded"),
                    ],
                  },
                  {
                    label: t("planLadderCollab"),
                    cells: [
                      t("planLadderNo"),
                      t("planLadderNo"),
                      t("planLadderYes"),
                      t("planLadderYes"),
                    ],
                  },
                  {
                    label: t("planLadderApi"),
                    cells: [
                      t("planLadderNo"),
                      t("planLadderNo"),
                      t("planLadderApiRead"),
                      t("planLadderApiFull"),
                    ],
                  },
                  {
                    label: t("planLadderRoles"),
                    cells: [
                      t("planLadderNo"),
                      t("planLadderNo"),
                      t("planLadderNo"),
                      t("planLadderYes"),
                    ],
                  },
                  {
                    label: t("planLadderSupport"),
                    cells: [
                      t("planLadderNo"),
                      t("planLadderNo"),
                      t("planLadderNo"),
                      t("planLadderYes"),
                    ],
                  },
                ] as const
              ).map((row) => (
                <tr key={row.label} className="border-b border-border/70">
                  <th className="px-4 py-2.5 text-xs font-medium text-foreground/80">
                    {row.label}
                  </th>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.label}-${index}`} className="px-3 py-2.5 text-xs">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("enterpriseLadder")}
        description={t("enterpriseLadderDesc")}
      >
        {renderTierGrid(salesTiers, "sales")}

        {flagshipTier ? (
          <div className="mt-3 flex flex-col gap-5 rounded-2xl border border-foreground/20 bg-background/40 p-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("flagship")}
              </p>
              <p className="mt-2 text-xl font-medium tracking-tight text-foreground">
                {tierName("flagship", flagshipTier.name)}
              </p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {tierDescription("flagship", flagshipTier.description)}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {tierFeatures("flagship", flagshipTier.features).map(
                  (feature) => (
                    <li key={feature} className="flex items-center gap-1.5">
                      <Check className="size-3 shrink-0 text-foreground/40" />
                      <span>{feature}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
              <Button
                type="button"
                className="bg-foreground text-background hover:bg-foreground/90"
                asChild
              >
                <a href={FOUNDERS_CONTACT}>{t("contactSales")}</a>
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
            <p className="text-xs text-muted-foreground">
              {t("knowledgeSources")}
            </p>
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
        {billing.portalEnabled ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-transparent text-foreground hover:bg-accent"
              asChild
            >
              <Link href="/api/portal">{t("openLegacyPolarPortal")}</Link>
            </Button>
            <p className="text-xs text-muted-foreground sm:self-center">
              {t("legacyPolarHint")}
            </p>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled
            className="border-border bg-transparent text-muted-foreground"
          >
            {t("openPortal")}
          </Button>
        )}
      </SettingsCard>
    </div>
  );
}

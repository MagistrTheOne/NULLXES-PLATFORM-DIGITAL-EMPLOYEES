"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  getFlagshipPricingTier,
  getSalesPricingTiers,
  getSelfServePricingTiers,
} from "@/features/billing/config/pricing-tiers";
import { getTierDisplayPrice } from "@/features/billing/config/display-pricing";
import { cn } from "@/lib/utils";

const SALES_CONTACT = "mailto:ceo@nullxes.com?subject=NULLXES%20Enterprise";

const TIER_FEATURE_LIMIT = 4;

const CAPACITY_TIER_IDS = new Set([
  "free",
  "starter",
  "studio",
  "operator",
  "scale",
]);

export function PricingSection() {
  const t = useTranslations("landing.pricing");
  const locale = useLocale();
  const selfServe = getSelfServePricingTiers();
  const sales = getSalesPricingTiers();
  const flagship = getFlagshipPricingTier();

  return (
    <section
      id="pricing"
      className="relative flex min-h-svh flex-col justify-center border-t border-white/12 px-5 py-16 sm:px-6 sm:py-20 md:px-10 lg:min-h-dvh lg:px-14 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-[11px] tracking-[0.28em] text-white/45 uppercase">
            {t("label")}
          </p>
          <h2 className="mt-4 font-(family-name:--font-landing-serif) text-[2.1rem] leading-[1.05] tracking-tight text-white sm:mt-5 sm:text-4xl lg:text-[3rem]">
            {t("title")}
          </h2>
        </header>

        <div className="mt-12 sm:mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
            <h3 className="text-xs font-medium tracking-[0.14em] text-white/70 uppercase">
              {t("platformTitle")}
            </h3>
            <p className="text-[11px] tracking-wide text-white/35">
              {t("platformNote")}
            </p>
          </div>

          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {selfServe.map((tier) => {
              const monthly = getTierDisplayPrice(tier.id, "month", locale);
              const annual = getTierDisplayPrice(tier.id, "year", locale);
              const isRecommended = Boolean(tier.recommended);
              const hasCapacity = CAPACITY_TIER_IDS.has(tier.id);

              return (
                <li key={tier.id}>
                  <article
                    className={cn(
                      "flex h-full min-h-60 flex-col border bg-black px-4 py-5 transition-[border-color,background-color] duration-150",
                      isRecommended
                        ? "border-white/35 bg-white/[0.03]"
                        : "border-white/12 hover:border-white/22 hover:bg-white/[0.02]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[12px] font-medium tracking-[0.08em] text-white uppercase">
                        {t(`tiers.${tier.id}`)}
                      </h4>
                      {isRecommended ? (
                        <span className="shrink-0 text-[9px] tracking-[0.16em] text-white/70 uppercase">
                          {t("recommended")}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-4 font-mono text-[1.35rem] leading-none tabular-nums tracking-tight text-white sm:text-[1.5rem]">
                      {monthly?.priceLabel ?? tier.priceLabel}
                    </p>
                    <p className="mt-1.5 text-[11px] text-white/40">
                      {tier.id === "free"
                        ? t("perEval")
                        : annual
                          ? t("perMonthAnnual", { annual: annual.priceLabel })
                          : t("perMonth")}
                    </p>
                    {hasCapacity ? (
                      <p className="mt-2 text-[11px] font-medium tracking-wide text-white/70">
                        {t(`capacity.${tier.id}`)}
                      </p>
                    ) : null}

                    <ul className="mt-4 flex flex-1 flex-col gap-1.5 border-t border-white/8 pt-3">
                      {tier.features
                        .slice(0, TIER_FEATURE_LIMIT)
                        .map((feature) => (
                          <li
                            key={feature}
                            className="text-[11px] leading-snug text-white/45"
                          >
                            {feature}
                          </li>
                        ))}
                    </ul>

                    <Link
                      href="/register"
                      className={cn(
                        "mt-5 inline-flex h-9 items-center justify-center text-xs font-medium transition-opacity hover:opacity-90",
                        isRecommended
                          ? "bg-white text-black"
                          : "border border-white/20 text-white/85 hover:border-white/40 hover:text-white",
                      )}
                    >
                      {tier.id === "free" ? t("startEval") : t("subscribe")}
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-14 sm:mt-16">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <h3 className="text-xs font-medium tracking-[0.14em] text-white/70 uppercase">
              {t("enterpriseTitle")}
            </h3>
            <a
              href={SALES_CONTACT}
              className="inline-flex h-9 items-center justify-center border border-white/25 px-4 text-xs tracking-wide text-white/80 transition-colors hover:border-white/45 hover:text-white"
            >
              {t("contactSales")}
            </a>
          </div>

          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sales.map((tier) => (
              <li key={tier.id}>
                <article className="flex h-full min-h-48 flex-col border border-white/12 bg-black px-4 py-5 transition-[border-color] duration-150 hover:border-white/22">
                  <h4 className="text-[12px] font-medium tracking-[0.08em] text-white uppercase">
                    {t(`tiers.${tier.id}`)}
                  </h4>
                  <p className="mt-3 font-mono text-sm tabular-nums text-white/70">
                    {t("byAgreement")}
                  </p>
                  <ul className="mt-4 flex flex-1 flex-col gap-1.5 border-t border-white/8 pt-3">
                    {tier.features
                      .slice(0, TIER_FEATURE_LIMIT)
                      .map((feature) => (
                        <li
                          key={feature}
                          className="text-[11px] leading-snug text-white/45"
                        >
                          {feature}
                        </li>
                      ))}
                  </ul>
                </article>
              </li>
            ))}
          </ul>

          {flagship ? (
            <article className="mt-3 flex flex-col gap-4 border border-white/20 bg-white/[0.03] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                  {t("flagship")}
                </p>
                <h4 className="mt-2 font-(family-name:--font-landing-serif) text-xl tracking-tight text-white sm:text-2xl">
                  {t(`tiers.${flagship.id}`)}
                </h4>
                <p className="mt-1 max-w-xl text-sm text-white/50">
                  {flagship.description}
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {flagship.features.map((feature) => (
                    <li key={feature} className="text-[11px] text-white/45">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <p className="font-mono text-sm tabular-nums text-white/70">
                  {t("byAgreement")}
                </p>
                <a
                  href={SALES_CONTACT}
                  className="inline-flex h-9 items-center justify-center bg-white px-4 text-xs font-medium text-black transition-opacity hover:opacity-90"
                >
                  {t("contactSales")}
                </a>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}

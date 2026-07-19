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

export function PricingSection() {
  const t = useTranslations("landing.pricing");
  const locale = useLocale();
  const selfServe = getSelfServePricingTiers();
  const sales = getSalesPricingTiers();
  const flagship = getFlagshipPricingTier();

  return (
    <section
      id="pricing"
      className="relative flex min-h-svh flex-col justify-center border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24 md:px-10 lg:min-h-dvh lg:px-14 lg:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
            {t("label")}
          </p>
          <h2 className="mt-5 font-(family-name:--font-landing-serif) text-[1.85rem] leading-[1.12] tracking-tight text-white sm:mt-6 sm:text-4xl lg:text-[2.75rem]">
            {t("title")}
          </h2>
        </header>

        <div className="mt-14 sm:mt-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-sm font-medium tracking-tight text-white/80">
              {t("platformTitle")}
            </h3>
            <p className="text-[11px] tracking-wide text-white/35">
              {t("platformNote")}
            </p>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {selfServe.map((tier) => {
              const monthly = getTierDisplayPrice(tier.id, "month", locale);
              const annual = getTierDisplayPrice(tier.id, "year", locale);
              const isRecommended = Boolean(tier.recommended);

              return (
                <li key={tier.id}>
                  <article
                    className={cn(
                      "flex h-full min-h-56 flex-col rounded-2xl border bg-white/2 px-4 py-4 transition-[border-color,background-color,box-shadow,transform] duration-200",
                      isRecommended
                        ? "border-(--landing-gold)/40 hover:border-(--landing-gold)/55"
                        : "border-white/8 hover:border-white/16",
                      "hover:-translate-y-0.5 hover:bg-white/4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[13px] font-medium tracking-tight text-white">
                        {t(`tiers.${tier.id}`)}
                      </h4>
                      {isRecommended ? (
                        <span className="shrink-0 text-[9px] tracking-[0.16em] text-(--landing-gold) uppercase">
                          {t("recommended")}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 font-mono text-lg tabular-nums tracking-tight text-white">
                      {monthly?.priceLabel ?? tier.priceLabel}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {tier.id === "free"
                        ? t("perEval")
                        : annual
                          ? t("perMonthAnnual", { annual: annual.priceLabel })
                          : t("perMonth")}
                    </p>

                    <ul className="mt-4 flex flex-1 flex-col gap-1.5">
                      {tier.features
                        .slice(0, TIER_FEATURE_LIMIT)
                        .map((feature) => (
                          <li
                            key={feature}
                            className="text-[11px] leading-snug text-white/50"
                          >
                            {feature}
                          </li>
                        ))}
                    </ul>

                    <Link
                      href="/register"
                      className={cn(
                        "mt-5 inline-flex h-9 items-center justify-center rounded-full text-xs font-medium transition-opacity hover:opacity-90",
                        isRecommended
                          ? "bg-white text-black"
                          : "border border-white/15 text-white/80 hover:border-white/30 hover:text-white",
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

        <div className="mt-16 sm:mt-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-medium tracking-tight text-white/80">
              {t("enterpriseTitle")}
            </h3>
            <a
              href={SALES_CONTACT}
              className="inline-flex h-9 items-center justify-center rounded-full border border-(--landing-gold)/50 px-4 text-xs tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10"
            >
              {t("contactSales")}
            </a>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sales.map((tier) => (
              <li key={tier.id}>
                <article className="flex h-full min-h-48 flex-col rounded-2xl border border-white/8 bg-white/2 px-4 py-4 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                  <h4 className="text-[13px] font-medium tracking-tight text-white">
                    {t(`tiers.${tier.id}`)}
                  </h4>
                  <p className="mt-3 font-mono text-sm tabular-nums text-(--landing-gold)">
                    {t("byAgreement")}
                  </p>
                  <ul className="mt-4 flex flex-1 flex-col gap-1.5">
                    {tier.features
                      .slice(0, TIER_FEATURE_LIMIT)
                      .map((feature) => (
                        <li
                          key={feature}
                          className="text-[11px] leading-snug text-white/50"
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
            <article className="mt-3 flex flex-col gap-4 rounded-2xl border border-white/12 bg-white/3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                  {t("flagship")}
                </p>
                <h4 className="mt-2 font-(family-name:--font-landing-serif) text-xl tracking-tight text-white sm:text-2xl">
                  {t(`tiers.${flagship.id}`)}
                </h4>
                <p className="mt-1 max-w-xl text-sm text-white/45">
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
                <p className="font-mono text-sm tabular-nums text-(--landing-gold)">
                  {t("byAgreement")}
                </p>
                <a
                  href={SALES_CONTACT}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-medium text-black transition-opacity hover:opacity-90"
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

"use client";

import { useTranslations } from "next-intl";

const CARD_IDS = [
  "controlledDeployment",
  "operationalContinuity",
  "accountablePresence",
] as const;

export function EnterpriseSection() {
  const t = useTranslations("landing.enterprise");

  return (
    <section
      id="enterprise"
      className="relative flex min-h-svh flex-col justify-center border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24 md:px-10 lg:min-h-dvh lg:px-14 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        <header className="max-w-2xl">
          <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
            {t("label")}
          </p>
          <h2 className="mt-5 max-w-xl font-(family-name:--font-landing-serif) text-[1.85rem] leading-[1.12] tracking-tight text-white sm:mt-6 sm:text-4xl lg:text-[2.75rem]">
            {t("title")}
          </h2>
        </header>

        <ul className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {CARD_IDS.map((id, index) => (
            <li key={id}>
              <article className="group relative flex h-full min-h-64 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/8 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:min-h-72 sm:px-7 sm:py-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
                />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] tracking-[0.22em] text-(--landing-gold)">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-(family-name:--font-landing-serif) text-xl tracking-tight text-white sm:text-2xl">
                    {t(`cards.${id}.title`)}
                  </h3>
                </div>
                <p className="mt-6 text-sm leading-relaxed text-white/50 sm:mt-7 sm:text-[15px]">
                  {t(`cards.${id}.body`)}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

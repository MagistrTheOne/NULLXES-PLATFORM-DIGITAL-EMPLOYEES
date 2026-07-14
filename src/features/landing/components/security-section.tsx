"use client";

import { useTranslations } from "next-intl";

const CARD_IDS = [
  "identityAccess",
  "infrastructureControl",
  "sessionGovernance",
] as const;

export function SecuritySection() {
  const t = useTranslations("landing.security");

  return (
    <section
      id="security"
      className="relative flex min-h-svh flex-col justify-center border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24 md:px-10 lg:min-h-dvh lg:px-14 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
            {t("label")}
          </p>
          <h1 className="mt-5 font-(family-name:--font-landing-serif) text-[1.85rem] leading-[1.12] tracking-tight text-white sm:mt-6 sm:text-4xl lg:text-[2.75rem]">
            {t("title")}
          </h1>
        </header>

        <div className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {CARD_IDS.map((id, index) => (
            <article
              key={id}
              className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/8 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:min-h-72 sm:px-7 sm:py-8"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
              />

              <div className="flex flex-1 flex-col">
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

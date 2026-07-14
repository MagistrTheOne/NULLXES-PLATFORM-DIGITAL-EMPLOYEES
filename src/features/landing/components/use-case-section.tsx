"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "support",
  "sales",
  "hr",
  "operations",
  "public",
  "legal",
] as const;

const glassCard =
  "flex h-full min-h-64 flex-col rounded-2xl border border-white/10 bg-white/5 px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/8 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:min-h-72 sm:px-7 sm:py-8";

export function UseCaseSection() {
  const t = useTranslations("landing.workforce");

  return (
    <section
      id="use-case"
      className="relative flex min-h-svh flex-col justify-center border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24 md:px-10 lg:min-h-dvh lg:px-14 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        <header className="max-w-2xl">
          <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
            {t("label")}
          </p>
          <h2 className="mt-5 font-(family-name:--font-landing-serif) text-[1.85rem] leading-[1.12] tracking-tight text-white sm:mt-6 sm:text-4xl lg:text-[2.75rem]">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/50 sm:text-[15px]">
            {t("subtitle")}
          </p>
        </header>

        <ul className="mt-14 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {CATEGORIES.map((id) => (
            <li key={id} className="min-h-0">
              <article className={cn(glassCard)}>
                <h3 className="text-[15px] font-medium tracking-tight text-white sm:text-base">
                  {t(`categories.${id}.title`)}
                </h3>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {(["role1", "role2", "role3"] as const).map((roleKey) => (
                    <li
                      key={roleKey}
                      className="flex items-start gap-2.5 text-[13px] leading-snug text-white/55"
                    >
                      <span
                        className="mt-1.5 size-1 shrink-0 rounded-full bg-white/35"
                        aria-hidden
                      />
                      <span>{t(`categories.${id}.${roleKey}`)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "support",
  "sales",
  "hr",
  "operations",
  "public",
] as const;

export function UseCaseSection() {
  const t = useTranslations("landing.workforce");

  return (
    <section
      id="use-case"
      className="relative border-t border-white/10 px-5 py-16 sm:px-6 sm:py-20 md:px-10 lg:px-14 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-2xl">
          <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
            {t("label")}
          </p>
          <h2 className="mt-4 font-(family-name:--font-landing-serif) text-[1.85rem] leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/50 sm:text-[15px]">
            {t("subtitle")}
          </p>
        </header>

        <ul className="mt-10 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
          {CATEGORIES.map((id) => (
            <li key={id} className="min-h-0">
              <article
                className={cn(
                  "flex h-full min-h-46 flex-col rounded-2xl border border-white/8 bg-white/2 px-4 py-4 transition-[transform,border-color,background-color,box-shadow] duration-200",
                  "hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/4 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
                )}
              >
                <h3 className="text-[13px] font-medium tracking-tight text-white">
                  {t(`categories.${id}.title`)}
                </h3>
                <ul className="mt-4 flex flex-1 flex-col gap-2">
                  {(
                    ["role1", "role2", "role3"] as const
                  ).map((roleKey) => (
                    <li
                      key={roleKey}
                      className="flex items-start gap-2 text-[12px] leading-snug text-white/55"
                    >
                      <span
                        className="mt-1.5 size-1 shrink-0 rounded-full bg-white/30"
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

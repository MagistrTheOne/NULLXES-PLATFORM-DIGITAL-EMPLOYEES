"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocaleCookie } from "@/shared/i18n/set-locale-cookie";
import type { AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LandingLocaleSwap({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("landing.nav");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextLocale: AppLocale = locale === "en" ? "ru" : "en";

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t("localeSwap")}
      title={t("localeSwap")}
      onClick={() => {
        startTransition(async () => {
          await setLocaleCookie(nextLocale);
          router.refresh();
        });
      }}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/15 px-2 text-[10px] font-medium tracking-[0.14em] text-white/65 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50",
        className,
      )}
    >
      {nextLocale === "ru" ? t("localeRu") : t("localeEn")}
    </button>
  );
}

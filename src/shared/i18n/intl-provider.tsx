"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AppLocale } from "@/i18n/config";

export function IntlProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: Record<string, unknown>;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

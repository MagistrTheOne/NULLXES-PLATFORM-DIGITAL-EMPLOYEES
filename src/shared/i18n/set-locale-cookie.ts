"use server";

import { cookies } from "next/headers";
import { isAppLocale, LOCALE_COOKIE, type AppLocale } from "@/i18n/config";

export async function setLocaleCookie(language: string): Promise<AppLocale> {
  const locale: AppLocale = isAppLocale(language) ? language : "en";
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return locale;
}

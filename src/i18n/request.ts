import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_COOKIE,
  type AppLocale,
} from "./config";
import { loadMessages } from "./load-messages";
import { resolveLocaleFromGeoHeaders } from "./resolve-locale-from-geo";

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  if (isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  const requestHeaders = await headers();
  return resolveLocaleFromGeoHeaders(requestHeaders) ?? DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await getRequestLocale();

  return {
    locale,
    messages: loadMessages(locale),
    timeZone: "UTC",
  };
});

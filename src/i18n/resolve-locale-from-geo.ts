import type { AppLocale } from "./config";
import { DEFAULT_LOCALE, isAppLocale } from "./config";

/** CIS / RF-adjacent markets → Russian UI on first visit. */
const RU_GEO_COUNTRIES = new Set([
  "RU",
  "BY",
  "KZ",
  "KG",
  "AM",
  "AZ",
  "UZ",
  "TJ",
  "MD",
]);

/**
 * Resolve locale from edge geo headers (Vercel / Cloudflare).
 * Never reads or stores the raw IP — only the country code the edge already
 * attaches. Cookie preference is handled by the caller.
 */
export function resolveLocaleFromGeoHeaders(
  headerBag: Headers | { get(name: string): string | null },
): AppLocale | null {
  const country = (
    headerBag.get("x-vercel-ip-country") ??
    headerBag.get("cf-ipcountry") ??
    ""
  )
    .trim()
    .toUpperCase();

  if (country && country !== "XX" && country !== "T1") {
    return RU_GEO_COUNTRIES.has(country) ? "ru" : "en";
  }

  const acceptLanguage = headerBag.get("accept-language");
  if (!acceptLanguage) {
    return null;
  }

  for (const part of acceptLanguage.split(",")) {
    const tag = part.trim().split(";")[0]?.trim().toLowerCase();
    if (!tag) {
      continue;
    }
    if (tag === "ru" || tag.startsWith("ru-")) {
      return "ru";
    }
    if (tag === "en" || tag.startsWith("en-")) {
      return "en";
    }
  }

  return null;
}

export function resolveLocaleOrDefault(
  headerBag: Headers | { get(name: string): string | null },
  cookieLocale?: string | null,
): AppLocale {
  if (isAppLocale(cookieLocale)) {
    return cookieLocale;
  }
  return resolveLocaleFromGeoHeaders(headerBag) ?? DEFAULT_LOCALE;
}

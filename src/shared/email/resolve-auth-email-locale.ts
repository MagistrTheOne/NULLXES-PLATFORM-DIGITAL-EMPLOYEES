import {
  DEFAULT_LOCALE,
  isAppLocale,
  LOCALE_COOKIE,
  type AppLocale,
} from "@/i18n/config";

export function resolveAuthEmailLocale(request?: Request): AppLocale {
  const cookieHeader = request?.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${LOCALE_COOKIE}=`));
    const value = match?.split("=")[1];
    if (isAppLocale(value)) {
      return value;
    }
  }

  const acceptLanguage = request?.headers.get("accept-language");
  if (acceptLanguage) {
    const primary = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
    if (isAppLocale(primary)) {
      return primary;
    }
  }

  return DEFAULT_LOCALE;
}

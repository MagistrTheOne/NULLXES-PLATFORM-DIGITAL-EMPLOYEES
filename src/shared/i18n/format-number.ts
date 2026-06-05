import type { AppLocale } from "@/i18n/config";

export function formatNumber(value: number, locale: AppLocale | string): string {
  return new Intl.NumberFormat(locale).format(value);
}

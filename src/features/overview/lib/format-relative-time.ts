import { formatDistanceToNow } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import type { AppLocale } from "@/i18n/config";

const DATE_FNS_LOCALES = {
  en: enUS,
  ru,
} as const;

export function formatRelativeTime(
  date: Date,
  locale: AppLocale = "en",
): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: DATE_FNS_LOCALES[locale],
  });
}

export function formatLiveDuration(startedAt: Date, now = Date.now()): string {
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

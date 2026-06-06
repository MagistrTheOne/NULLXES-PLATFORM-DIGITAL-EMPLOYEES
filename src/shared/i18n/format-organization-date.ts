import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";

export const ORGANIZATION_DATE_FORMATS = [
  "MMM d, yyyy",
  "dd/MM/yyyy",
  "yyyy-MM-dd",
] as const;

export type OrganizationDateFormat = (typeof ORGANIZATION_DATE_FORMATS)[number];

export const DATE_FORMAT_PREVIEW_DATE = new Date(2026, 5, 4);

function resolveDateFnsLocale(locale?: string) {
  return locale === "ru" ? ru : enUS;
}

function resolveDatePattern(dateFormat?: string): OrganizationDateFormat {
  if (
    dateFormat === "MMM d, yyyy" ||
    dateFormat === "dd/MM/yyyy" ||
    dateFormat === "yyyy-MM-dd"
  ) {
    return dateFormat;
  }

  return "MMM d, yyyy";
}

export function formatOrganizationDate(
  date: Date | string | number,
  options?: {
    dateFormat?: string;
    locale?: string;
  },
): string {
  const parsed = date instanceof Date ? date : new Date(date);

  return format(parsed, resolveDatePattern(options?.dateFormat), {
    locale: resolveDateFnsLocale(options?.locale),
  });
}

export function formatOrganizationDateTime(
  date: Date | string | number,
  options?: {
    dateFormat?: string;
    timeFormat?: string;
    locale?: string;
  },
): string {
  const parsed = date instanceof Date ? date : new Date(date);
  const timePattern = options?.timeFormat === "12h" ? "h:mm a" : "HH:mm";
  const pattern = `${resolveDatePattern(options?.dateFormat)} ${timePattern}`;

  return format(parsed, pattern, {
    locale: resolveDateFnsLocale(options?.locale),
  });
}

export function getOrganizationDateFormat(value?: string): OrganizationDateFormat {
  return resolveDatePattern(value);
}

export function formatDateFormatPreview(
  dateFormat: OrganizationDateFormat,
  locale?: string,
): string {
  return formatOrganizationDate(DATE_FORMAT_PREVIEW_DATE, { dateFormat, locale });
}

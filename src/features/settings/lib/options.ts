export const INDUSTRY_OPTIONS = [
  { value: "enterprise", labelKey: "enterprise" },
  { value: "technology", labelKey: "technology" },
  { value: "healthcare", labelKey: "healthcare" },
  { value: "finance", labelKey: "finance" },
  { value: "legal", labelKey: "legal" },
  { value: "other", labelKey: "other" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "UTC", labelKey: "tzUTC" },
  { value: "Europe/Moscow", labelKey: "tzMoscow" },
  { value: "Europe/London", labelKey: "tzLondon" },
  { value: "America/New_York", labelKey: "tzNewYork" },
  { value: "America/Los_Angeles", labelKey: "tzLosAngeles" },
  { value: "Asia/Dubai", labelKey: "tzDubai" },
  { value: "Asia/Singapore", labelKey: "tzSingapore" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en", labelKey: "en" },
  { value: "ru", labelKey: "ru" },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { value: "MMM d, yyyy", labelKey: "dateFmtUs" },
  { value: "dd/MM/yyyy", labelKey: "dateFmtEu" },
  { value: "yyyy-MM-dd", labelKey: "dateFmtIso" },
] as const;

export const TIME_FORMAT_OPTIONS = [
  { value: "24h", labelKey: "24h" },
  { value: "12h", labelKey: "12h" },
] as const;

export const TIME_RANGE_OPTIONS = [
  { value: 7, labelKey: "days7" },
  { value: 14, labelKey: "days14" },
  { value: 30, labelKey: "days30" },
] as const;

export const RETENTION_OPTIONS = [
  { value: 30, labelKey: "retention30" },
  { value: 90, labelKey: "retention90" },
  { value: 180, labelKey: "retention180" },
  { value: 365, labelKey: "retention365" },
] as const;

export const KNOWLEDGE_PROCESSING_OPTIONS = [
  { value: "auto", labelKey: "auto" },
  { value: "manual", labelKey: "manual" },
] as const;

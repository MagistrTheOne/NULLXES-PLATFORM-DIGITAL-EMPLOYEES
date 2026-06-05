export const INDUSTRY_OPTIONS = [
  { value: "enterprise", label: "Enterprise" },
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "legal", label: "Legal" },
  { value: "other", label: "Other" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "Europe/Moscow", label: "GMT+03:00 Europe/Moscow" },
  { value: "Europe/London", label: "GMT+00:00 Europe/London" },
  { value: "America/New_York", label: "GMT-05:00 America/New_York" },
  { value: "America/Los_Angeles", label: "GMT-08:00 America/Los_Angeles" },
  { value: "Asia/Dubai", label: "GMT+04:00 Asia/Dubai" },
  { value: "Asia/Singapore", label: "GMT+08:00 Asia/Singapore" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ru", label: "Russian" },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { value: "MMM d, yyyy", label: "May 30, 2025" },
  { value: "dd/MM/yyyy", label: "30/05/2025" },
  { value: "yyyy-MM-dd", label: "2025-05-30" },
] as const;

export const TIME_FORMAT_OPTIONS = [
  { value: "24h", label: "24-hour" },
  { value: "12h", label: "12-hour" },
] as const;

export const TIME_RANGE_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
] as const;

export const RETENTION_OPTIONS = [
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "365 days" },
] as const;

export const KNOWLEDGE_PROCESSING_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "manual", label: "Manual" },
] as const;

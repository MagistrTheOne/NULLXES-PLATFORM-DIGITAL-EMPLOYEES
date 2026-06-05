import type { AnalyticsDateRange } from "../types";

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function endOfUtcDay(date: Date): Date {
  const end = startOfUtcDay(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDefaultAnalyticsRange(): AnalyticsDateRange {
  const to = startOfUtcDay(new Date());
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 6);
  return { from, to };
}

export function getRangeDayCount(range: AnalyticsDateRange): number {
  const from = startOfUtcDay(range.from).getTime();
  const to = startOfUtcDay(range.to).getTime();
  return Math.floor((to - from) / 86_400_000) + 1;
}

export function getPreviousAnalyticsRange(
  range: AnalyticsDateRange,
): AnalyticsDateRange {
  const dayCount = getRangeDayCount(range);
  const previousTo = new Date(startOfUtcDay(range.from));
  previousTo.setUTCDate(previousTo.getUTCDate() - 1);
  const previousFrom = new Date(previousTo);
  previousFrom.setUTCDate(previousFrom.getUTCDate() - (dayCount - 1));
  return { from: previousFrom, to: previousTo };
}

export function buildDateRange(range: AnalyticsDateRange): string[] {
  const from = startOfUtcDay(range.from);
  const to = startOfUtcDay(range.to);
  const dates: string[] = [];
  const cursor = new Date(from);

  while (cursor.getTime() <= to.getTime()) {
    dates.push(formatUtcDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function parseAnalyticsDateRange(
  searchParams: Record<string, string | string[] | undefined>,
): AnalyticsDateRange {
  const fromParam = searchParams.from;
  const toParam = searchParams.to;
  const fromValue = Array.isArray(fromParam) ? fromParam[0] : fromParam;
  const toValue = Array.isArray(toParam) ? toParam[0] : toParam;

  if (!fromValue || !toValue) {
    return getDefaultAnalyticsRange();
  }

  const from = startOfUtcDay(new Date(`${fromValue}T00:00:00.000Z`));
  const to = startOfUtcDay(new Date(`${toValue}T00:00:00.000Z`));

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return getDefaultAnalyticsRange();
  }

  return { from, to };
}

export function formatAnalyticsRangeLabel(range: AnalyticsDateRange): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${formatter.format(range.from)} – ${formatter.format(range.to)}`;
}

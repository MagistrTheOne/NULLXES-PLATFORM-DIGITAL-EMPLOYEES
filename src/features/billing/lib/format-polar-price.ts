const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  const code = currency.toUpperCase();
  const cached = currencyFormatters.get(code);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  currencyFormatters.set(code, formatter);
  return formatter;
}

export function formatPolarAmount(input: {
  amountCents: number;
  currency: string;
}): string {
  return getCurrencyFormatter(input.currency).format(input.amountCents / 100);
}

export function formatPolarRecurringNote(
  interval: string | null | undefined,
  intervalCount = 1,
): string {
  if (!interval) {
    return "one-time";
  }

  const unit =
    interval === "month"
      ? "month"
      : interval === "year"
        ? "year"
        : interval === "week"
          ? "week"
          : "day";

  if (intervalCount === 1) {
    return `per ${unit}`;
  }

  return `every ${intervalCount} ${unit}s`;
}

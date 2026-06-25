import type { HqActivityBadge } from "../types";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

/**
 * Resolve a badge to display text. A literal task title wins; otherwise the
 * localizable key (with optional ICU count) is translated.
 */
export function resolveActivityBadgeLabel(
  badge: HqActivityBadge | null,
  translate: TranslateFn,
): string | null {
  if (!badge) {
    return null;
  }
  if (badge.text) {
    return badge.text;
  }
  if (!badge.key) {
    return null;
  }
  return badge.count === undefined
    ? translate(badge.key)
    : translate(badge.key, { count: badge.count });
}

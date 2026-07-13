import { cn } from "@/lib/utils";

/** Max content width tiers for dashboard pages. */
export const PLATFORM_MAX_WIDTH = {
  standard: "max-w-[1760px]",
  wide: "max-w-[1920px] min-[1800px]:max-w-[1920px]",
} as const;

/** Shared page padding and vertical rhythm. */
export const platformPagePaddingClass =
  "gap-4 p-4 sm:gap-5 sm:p-5 md:gap-6 md:p-6 2xl:px-8";

export const platformCompactPagePaddingClass =
  "gap-3 p-3 sm:gap-4 sm:p-4 md:gap-4 md:p-5 2xl:px-6";

/** Break out of page padding only — stays inside SidebarInset (never w-screen). */
export const platformInsetBleedClass =
  "relative -mx-4 max-w-none sm:-mx-5 md:-mx-6 2xl:-mx-8";

/** @deprecated Prefer platformInsetBleedClass — w-screen overlaps the sidebar. */
export const platformFullBleedClass = platformInsetBleedClass;

/** Standard responsive metric strip grid. */
export const platformMetricGridClass =
  "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6";

/** Employee card grid — max 4 columns so page size maps to clean rows. */
export const platformEmployeeGridClass =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4";

export function platformPageShellClass(options?: {
  width?: keyof typeof PLATFORM_MAX_WIDTH;
  compact?: boolean;
  className?: string;
}): string {
  const width = options?.width ?? "wide";
  return cn(
    "mx-auto flex w-full min-w-0 flex-1 flex-col",
    options?.compact ? platformCompactPagePaddingClass : platformPagePaddingClass,
    PLATFORM_MAX_WIDTH[width],
    options?.className,
  );
}

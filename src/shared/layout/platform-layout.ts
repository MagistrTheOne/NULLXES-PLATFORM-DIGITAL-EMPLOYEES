import { cn } from "@/lib/utils";

/** Max content width tiers for dashboard pages. */
export const PLATFORM_MAX_WIDTH = {
  standard: "max-w-[1760px]",
  wide: "max-w-[1920px] min-[1800px]:max-w-[1920px]",
} as const;

/** Shared page padding and vertical rhythm. */
export const platformPagePaddingClass =
  "gap-4 p-4 sm:gap-5 sm:p-5 md:gap-6 md:p-6 2xl:px-8";

/** Break out of a centered max-width parent (e.g. talk workspace). */
export const platformFullBleedClass =
  "relative left-1/2 w-screen max-w-none -translate-x-1/2 px-4 sm:px-5 md:px-6 2xl:px-8";

/** Standard responsive metric strip grid. */
export const platformMetricGridClass =
  "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6";

/** Employee card grid density across viewports. */
export const platformEmployeeGridClass =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 min-[1800px]:grid-cols-5 min-[1800px]:gap-6";

export function platformPageShellClass(options?: {
  width?: keyof typeof PLATFORM_MAX_WIDTH;
  className?: string;
}): string {
  const width = options?.width ?? "wide";
  return cn(
    "mx-auto flex w-full min-w-0 flex-1 flex-col",
    platformPagePaddingClass,
    PLATFORM_MAX_WIDTH[width],
    options?.className,
  );
}

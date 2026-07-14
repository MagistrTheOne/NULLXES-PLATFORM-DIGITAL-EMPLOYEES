import { cn } from "@/lib/utils";

/**
 * Full-bleed gray workspace for Capsules / Inventory.
 * Breaks out of DashboardLayout's platformPageShell padding so the panel
 * fills the inset (mock #121212) without narrowing content.
 */
export function rewardsWorkspaceClass(className?: string): string {
  return cn(
    "relative -mx-4 -my-4 flex min-h-[calc(100svh-3.5rem)] w-auto max-w-none flex-1 flex-col bg-[#121212] text-white",
    "p-5 sm:-mx-5 sm:-my-5 sm:p-6 md:-mx-6 md:-my-6 md:p-7 2xl:-mx-8 lg:px-8 lg:py-7",
    className,
  );
}

/** Shared action button — Capsules / Inventory / Reward Details. */
export const rewardsActionButtonClass =
  "inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-medium tracking-wide";

export const rewardsPrimaryButtonClass = cn(
  rewardsActionButtonClass,
  "bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/35",
);

export const rewardsSecondaryButtonClass = cn(
  rewardsActionButtonClass,
  "border border-white/12 bg-transparent text-white/70 hover:bg-white/5 disabled:opacity-40",
);

export const rewardsMutedButtonClass = cn(
  rewardsActionButtonClass,
  "border border-white/10 bg-white/5 text-white/40",
);

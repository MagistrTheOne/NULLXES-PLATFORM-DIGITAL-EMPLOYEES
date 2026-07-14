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

/** Primary CTA used only on Capsules / Inventory (mock gold). */
export const rewardsPrimaryButtonClass =
  "h-10 w-full rounded-xl bg-linear-to-r from-amber-200 via-amber-100 to-amber-300 text-sm font-semibold tracking-wide text-black hover:from-amber-100 hover:via-white hover:to-amber-200";

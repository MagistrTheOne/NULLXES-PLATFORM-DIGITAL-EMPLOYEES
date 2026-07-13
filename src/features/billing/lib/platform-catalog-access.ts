import type { BillingPlanId } from "@/features/billing/config/plans";
import { ADELINE_KALEN_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";

/** Starter pack — Free / Starter / Studio catalog access. */
export const STARTER_PLATFORM_CATALOG_EMPLOYEE_IDS = [
  ADELINE_KALEN_EMPLOYEE_ID,
  "28582def-fbe3-42cb-ba6e-8a3f2c938622", // Yuki
] as const;

export type PlatformCatalogAccess = "starter" | "extended" | "full";

/**
 * Catalog access by plan. Custom employee seats are separate (maxEmployees).
 * Extended/full currently expose all published rows until marketplace tiers land.
 */
export function planPlatformCatalogAccess(
  planId: BillingPlanId,
): PlatformCatalogAccess {
  switch (planId) {
    case "free":
    case "starter":
    case "studio":
      return "starter";
    case "operator":
      return "extended";
    case "scale":
    case "enterprise":
    case "government":
      return "full";
    default:
      return "starter";
  }
}

export function filterEmployeeIdsByCatalogAccess(
  employeeIds: string[],
  access: PlatformCatalogAccess,
): string[] {
  if (access === "extended" || access === "full") {
    return employeeIds;
  }

  const starter = new Set<string>(STARTER_PLATFORM_CATALOG_EMPLOYEE_IDS);
  return employeeIds.filter((id) => starter.has(id));
}

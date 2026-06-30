import { ensureOrganizationSettings } from "@/entities/organization-settings";
import type { AnalyticsDateRange } from "../types";
import { buildAnalyticsRangeFromDayCount } from "./date-range";

export async function getOrganizationAnalyticsRange(
  organizationId: string,
): Promise<AnalyticsDateRange> {
  const settings = await ensureOrganizationSettings(organizationId);
  return buildAnalyticsRangeFromDayCount(settings.defaultTimeRangeDays);
}

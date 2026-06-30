import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { AnalyticsScreen, getDashboardAnalytics } from "@/features/analytics";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { parseAnalyticsDateRange } from "@/features/analytics/lib/date-range";
import { HQ_DEPARTMENTS, type HqDepartment } from "@/features/hq/types";

function parseDepartment(
  value: string | string[] | undefined,
): HqDepartment | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return HQ_DEPARTMENTS.includes(raw as HqDepartment)
    ? (raw as HqDepartment)
    : null;
}

export default async function DashboardAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const settings = await ensureOrganizationSettings(workspace.organization.id);
  const resolvedSearchParams = await searchParams;
  const range = parseAnalyticsDateRange(
    resolvedSearchParams,
    settings.defaultTimeRangeDays,
  );
  const department = parseDepartment(resolvedSearchParams.department);
  const data = await getDashboardAnalytics(
    workspace.organization.id,
    range,
    department,
  );

  return <AnalyticsScreen data={data} />;
}

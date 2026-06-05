import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { AnalyticsScreen, getDashboardAnalytics } from "@/features/analytics";
import { parseAnalyticsDateRange } from "@/features/analytics/lib/date-range";

export default async function DashboardAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const resolvedSearchParams = await searchParams;
  const range = parseAnalyticsDateRange(resolvedSearchParams);
  const data = await getDashboardAnalytics(workspace.organization.id, range);

  return <AnalyticsScreen data={data} />;
}

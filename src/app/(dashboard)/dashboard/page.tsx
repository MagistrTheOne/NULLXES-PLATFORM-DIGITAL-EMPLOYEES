import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { parseAnalyticsDateRange } from "@/features/analytics/lib/date-range";
import { getDashboardOverview, OverviewScreen } from "@/features/overview";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const resolvedSearchParams = await searchParams;
  const range = parseAnalyticsDateRange(resolvedSearchParams);
  const data = await getDashboardOverview(workspace.organization.id, range);

  return <OverviewScreen data={data} />;
}

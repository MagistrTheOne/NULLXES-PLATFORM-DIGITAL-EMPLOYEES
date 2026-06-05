import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { AnalyticsScreen, getDashboardAnalytics } from "@/features/analytics";

export default async function DashboardAnalyticsPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const data = await getDashboardAnalytics(workspace.organization.id);

  return <AnalyticsScreen data={data} />;
}

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getSettingsPageData, SettingsScreen } from "@/features/settings";

export default async function SettingsPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const data = await getSettingsPageData(workspace);

  return <SettingsScreen data={data} />;
}

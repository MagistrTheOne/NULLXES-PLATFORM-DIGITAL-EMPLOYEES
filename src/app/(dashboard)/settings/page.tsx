import { Suspense } from "react";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { AgentBlueprintSettingsTabs } from "@/features/agent-blueprint/components/agent-blueprint-settings-tabs";
import { getSettingsPageData, SettingsScreen } from "@/features/settings";

type SettingsSearchParams = {
  tab?: string;
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SettingsSearchParams>;
}) {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const data = await getSettingsPageData(workspace, {
    currentSessionId: session.session.id,
  });
  const params = await searchParams;
  const tab = params.tab ?? "general";
  const blueprintTab =
    tab === "characters" || tab === "skills" || tab === "tools"
      ? (tab as "characters" | "skills" | "tools")
      : null;

  return (
    <SettingsScreen
      data={data}
      blueprintTab={
        blueprintTab ? (
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
            <AgentBlueprintSettingsTabs
              organizationId={workspace.organization.id}
              canManage={data.canManageOrganization}
              tab={blueprintTab}
            />
          </Suspense>
        ) : null
      }
    />
  );
}

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { DashboardShellUser, DashboardShellWorkspace } from "../types";
import { UserMenu } from "./user-menu";
import { WorkspaceHeader } from "./workspace-header";

export function DashboardTopbar({
  workspace,
  user,
}: {
  workspace: DashboardShellWorkspace;
  user: DashboardShellUser;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-black px-4">
      <SidebarTrigger className="text-white hover:bg-white/5 hover:text-white" />
      <Separator orientation="vertical" className="h-6 bg-white/10" />
      <div className="min-w-0 flex-1">
        <WorkspaceHeader workspace={workspace} />
      </div>
      <UserMenu user={user} />
    </header>
  );
}

import { SidebarTrigger } from "@/components/ui/sidebar";
import type { DashboardShellWorkspace } from "../types";
import { WorkspaceHeader } from "./workspace-header";

export function DashboardTopbar({
  workspace,
}: {
  workspace: DashboardShellWorkspace;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-black px-4">
      <SidebarTrigger className="text-white hover:bg-white/5 hover:text-white" />
      <div className="min-w-0 flex-1">
        <WorkspaceHeader workspace={workspace} />
      </div>
    </header>
  );
}

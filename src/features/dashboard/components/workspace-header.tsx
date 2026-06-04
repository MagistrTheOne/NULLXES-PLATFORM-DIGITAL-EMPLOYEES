import type { DashboardShellWorkspace } from "../types";

function formatOrganizationType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function WorkspaceHeader({
  workspace,
}: {
  workspace: DashboardShellWorkspace;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="truncate text-sm font-medium text-white">
        {workspace.organizationName}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
        <span className="capitalize">{workspace.role}</span>
        <span className="text-white/30">·</span>
        <span>{formatOrganizationType(workspace.organizationType)}</span>
      </div>
    </div>
  );
}

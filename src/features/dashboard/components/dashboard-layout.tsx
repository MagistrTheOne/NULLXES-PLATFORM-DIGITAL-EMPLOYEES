"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceDisplayPreferencesProvider } from "@/features/workspace/components/workspace-display-preferences-provider";
import { WorkspacePermissionsProvider } from "@/features/workspace/components/workspace-permissions-provider";
import { WorkspaceBillingProvider } from "@/features/workspace/components/workspace-billing-provider";
import { platformPageShellClass } from "@/shared/layout/platform-layout";
import { dashboardSidebarCssVars } from "../constants";
import type { DashboardLayoutProps } from "../types";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

export function DashboardLayout({
  user,
  workspace,
  permissions,
  displayPreferences,
  isPlatformAdmin,
  children,
}: DashboardLayoutProps) {
  return (
    <WorkspacePermissionsProvider permissions={permissions}>
      <WorkspaceBillingProvider billing={workspace.billing}>
      <WorkspaceDisplayPreferencesProvider preferences={displayPreferences}>
      <TooltipProvider delayDuration={0}>
      <SidebarProvider
        defaultOpen
        style={dashboardSidebarCssVars}
        className="min-h-svh bg-black text-white"
      >
        <DashboardSidebar
          user={user}
          workspace={workspace}
          isPlatformAdmin={isPlatformAdmin}
        />
        <SidebarInset className="flex min-h-svh min-w-0 flex-1 flex-col bg-black">
          <DashboardTopbar />
          <div
            className={platformPageShellClass({
              width: "wide",
              compact: displayPreferences.compactMode,
            })}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
    </WorkspaceDisplayPreferencesProvider>
      </WorkspaceBillingProvider>
    </WorkspacePermissionsProvider>
  );
}

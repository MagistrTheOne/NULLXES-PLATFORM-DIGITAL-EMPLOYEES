"use client";

import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceDisplayPreferencesProvider } from "@/features/workspace/components/workspace-display-preferences-provider";
import { WorkspacePermissionsProvider } from "@/features/workspace/components/workspace-permissions-provider";
import { WorkspaceBillingProvider } from "@/features/workspace/components/workspace-billing-provider";
import { cn } from "@/lib/utils";
import { platformPageShellClass } from "@/shared/layout/platform-layout";
import { dashboardSidebarCssVars } from "../constants";
import { isMobileTalkRoute } from "../lib/mobile-nav";
import type { DashboardLayoutProps } from "../types";
import { DashboardMobileNav } from "./dashboard-mobile-nav";
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
  const pathname = usePathname();
  const talkRoute = isMobileTalkRoute(pathname);

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
              <SidebarInset
                className={cn(
                  "flex min-h-svh min-w-0 flex-1 flex-col bg-black",
                  !talkRoute &&
                    "max-md:pb-[calc(4rem+env(safe-area-inset-bottom))]",
                )}
              >
                <DashboardTopbar />
                <div
                  className={platformPageShellClass({
                    width: "wide",
                    compact: displayPreferences.compactMode,
                  })}
                >
                  {children}
                </div>
                <DashboardMobileNav isPlatformAdmin={isPlatformAdmin} />
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </WorkspaceDisplayPreferencesProvider>
      </WorkspaceBillingProvider>
    </WorkspacePermissionsProvider>
  );
}

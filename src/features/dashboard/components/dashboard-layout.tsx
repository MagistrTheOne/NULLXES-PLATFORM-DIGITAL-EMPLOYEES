"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { dashboardSidebarCssVars } from "../constants";
import type { DashboardLayoutProps } from "../types";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

export function DashboardLayout({
  user,
  workspace,
  children,
}: DashboardLayoutProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider
        defaultOpen
        style={dashboardSidebarCssVars}
        className="min-h-svh bg-black text-white"
      >
        <DashboardSidebar user={user} />
        <SidebarInset className="flex min-h-svh min-w-0 flex-1 flex-col bg-black">
          <DashboardTopbar workspace={workspace} />
          <div className="flex min-w-0 flex-1 flex-col gap-6 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

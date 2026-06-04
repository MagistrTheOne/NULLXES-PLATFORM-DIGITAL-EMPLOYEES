"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
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
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-black text-white">
        <DashboardSidebar />
        <SidebarInset className="bg-black">
          <DashboardTopbar workspace={workspace} user={user} />
          <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </TooltipProvider>
  );
}

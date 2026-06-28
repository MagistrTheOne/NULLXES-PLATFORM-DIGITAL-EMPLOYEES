"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { DashboardShellUser, DashboardShellWorkspace } from "../types";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarUserSection } from "./sidebar-user-section";

const NAV_ITEMS = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "employees", href: "/dashboard/employees", icon: Users },
  { labelKey: "conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { labelKey: "hq", href: "/dashboard/hq", icon: Building2 },
  { labelKey: "analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { labelKey: "settings", href: "/settings", icon: Settings },
] as const;

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isBillingNavActive(pathname: string, tab: string | null): boolean {
  return pathname === "/settings" && tab === "billing";
}

export function DashboardSidebar({
  user,
  workspace,
}: {
  user: DashboardShellUser;
  workspace: DashboardShellWorkspace;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("common.nav");
  const isBillingActive = isBillingNavActive(pathname, searchParams.get("tab"));

  return (
    <Sidebar
      collapsible="icon"
      className="border-white/10 bg-[#0a0a0a] text-white"
    >
      <SidebarHeader className="border-b border-white/10 px-3 py-4">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/50 group-data-[collapsible=icon]:hidden">
            {t("navigation")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={t(item.labelKey)}
                      className="text-white/80 transition-none hover:bg-white/5 hover:text-white data-active:bg-white/10 data-active:text-white"
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-white/10 px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isBillingActive}
              tooltip={t("billing")}
              className="text-white/80 transition-none hover:bg-white/5 hover:text-white data-active:bg-white/10 data-active:text-white"
            >
              <Link href="/settings?tab=billing">
                <CreditCard />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
                  <span>{t("billing")}</span>
                  <span className="truncate text-xs text-white/45">
                    {workspace.billing.planName}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarUserSection user={user} workspace={workspace} />
      </SidebarFooter>
    </Sidebar>
  );
}

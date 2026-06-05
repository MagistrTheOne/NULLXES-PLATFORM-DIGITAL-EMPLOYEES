"use client";

import Link from "next/link";
import { CreditCard, LogOut, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardShellUser, DashboardShellWorkspace } from "../types";
import { useDashboardSidebar } from "../use-dashboard-sidebar";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "NX";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function formatOrganizationType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function SidebarUserSection({
  user,
  workspace,
}: {
  user: DashboardShellUser;
  workspace: DashboardShellWorkspace;
}) {
  const { sidebarState } = useDashboardSidebar();
  const t = useTranslations("common.userMenu");
  const isExpanded = sidebarState === "expanded";
  const organizationType = formatOrganizationType(workspace.organizationType);
  const { billing } = workspace;
  const showUpgrade = Boolean(billing.checkoutUrl);
  const showPortal =
    Boolean(billing.portalUrl) &&
    (billing.planId === "super_pro" ||
      billing.planId === "enterprise" ||
      billing.planId === "government");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={
            isExpanded
              ? "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/20"
              : "mx-auto flex size-10 items-center justify-center rounded-lg outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/20"
          }
        >
          <Avatar className="size-9 shrink-0 border border-white/10">
            <AvatarFallback className="bg-white/10 text-xs text-white">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          {isExpanded ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {workspace.organizationName}
              </p>
              <p className="truncate text-xs text-white/60 capitalize">
                {workspace.role}
                <span className="text-white/30"> · </span>
                {billing.planName}
              </p>
            </div>
          ) : null}
          <span className="sr-only">{user.email}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isExpanded ? "top" : "right"}
        align={isExpanded ? "start" : "center"}
        className="w-64 border-white/10 bg-[#111111] text-white"
      >
        <DropdownMenuLabel className="space-y-1 font-normal">
          <p className="text-sm font-medium">{workspace.organizationName}</p>
          <p className="text-xs text-white/60 capitalize">
            {workspace.role}
            <span className="text-white/30"> · </span>
            {organizationType}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-white/60">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-white/50">{t("plan")}</p>
          <p className="text-sm font-medium">
            {billing.planName}
            <span className="font-normal text-white/50">
              {" "}
              · {billing.priceLabel}
            </span>
          </p>
        </DropdownMenuLabel>
        {showUpgrade ? (
          <DropdownMenuItem
            asChild
            className="cursor-pointer text-white focus:bg-white/10 focus:text-white"
          >
            <Link href={billing.checkoutUrl!}>
              <Sparkles />
              {t("upgrade")}
            </Link>
          </DropdownMenuItem>
        ) : null}
        {showPortal ? (
          <DropdownMenuItem
            asChild
            className="cursor-pointer text-white focus:bg-white/10 focus:text-white"
          >
            <Link href={billing.portalUrl!}>
              <CreditCard />
              {t("manageSubscription")}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-white focus:bg-white/10 focus:text-white"
        >
          <Link href="/settings?tab=billing">
            <CreditCard />
            {t("billingSettings")}
          </Link>
        </DropdownMenuItem>
        {billing.planId === "free" && billing.canManageBilling ? (
          <DropdownMenuItem
            asChild
            className="cursor-pointer text-white focus:bg-white/10 focus:text-white"
          >
            <a href="mailto:sales@nullxes.com">{t("contactSales")}</a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-white focus:bg-white/10 focus:text-white"
        >
          <Link href="/logout">
            <LogOut />
            {t("logout")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

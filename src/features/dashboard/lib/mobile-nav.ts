import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookText,
  Building2,
  CreditCard,
  Home,
  KeyRound,
  Menu,
  MessageSquare,
  Package,
  Radar,
  Settings,
  Sparkles,
  Library,
  Users,
} from "lucide-react";

export type MobilePrimaryTabId = "employees" | "inbox" | "home" | "more";

export type MobilePrimaryTab = {
  id: MobilePrimaryTabId;
  href?: string;
  labelKey: "employees" | "inbox" | "home" | "more";
  icon: LucideIcon;
};

export type MobileMoreItem = {
  id: string;
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Soft hint for WebGL / dense tools */
  desktopHint?: boolean;
  adminOnly?: boolean;
};

/** Primary mobile anchors — Talk is not a tab. */
export const MOBILE_PRIMARY_TABS: MobilePrimaryTab[] = [
  {
    id: "employees",
    href: "/dashboard/employees",
    labelKey: "employees",
    icon: Users,
  },
  {
    id: "inbox",
    href: "/dashboard/conversations",
    labelKey: "inbox",
    icon: MessageSquare,
  },
  {
    id: "home",
    href: "/dashboard",
    labelKey: "home",
    icon: Home,
  },
  {
    id: "more",
    labelKey: "more",
    icon: Menu,
  },
];

export const MOBILE_MORE_ITEMS: MobileMoreItem[] = [
  {
    id: "missions",
    href: "/dashboard/missions",
    labelKey: "missions",
    icon: Radar,
  },
  {
    id: "capsules",
    href: "/dashboard/capsules",
    labelKey: "capsules",
    icon: Sparkles,
  },
  {
    id: "collection",
    href: "/dashboard/collection",
    labelKey: "collection",
    icon: Library,
  },
  {
    id: "inventory",
    href: "/dashboard/inventory",
    labelKey: "inventory",
    icon: Package,
  },
  {
    id: "hq",
    href: "/dashboard/hq",
    labelKey: "hq",
    icon: Building2,
    desktopHint: true,
  },
  {
    id: "analytics",
    href: "/dashboard/analytics",
    labelKey: "analytics",
    icon: BarChart3,
  },
  {
    id: "settings",
    href: "/settings",
    labelKey: "settings",
    icon: Settings,
  },
  {
    id: "billing",
    href: "/settings?tab=billing",
    labelKey: "billing",
    icon: CreditCard,
  },
  {
    id: "docs",
    href: "/docs",
    labelKey: "documentation",
    icon: BookText,
  },
  {
    id: "platformAnalytics",
    href: "/dashboard/admin/analytics",
    labelKey: "platformAnalytics",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    id: "anamAdmin",
    href: "/dashboard/admin/anam",
    labelKey: "anamAdmin",
    icon: KeyRound,
    adminOnly: true,
  },
];

export function isMobileTalkRoute(pathname: string): boolean {
  return /\/talk(?:\/|$)/.test(pathname);
}

/** Full-screen chat / talk — hide the fixed mobile tab bar. */
export function isMobileImmersiveChatRoute(
  pathname: string,
  searchParams?: URLSearchParams | { get(name: string): string | null },
): boolean {
  if (isMobileTalkRoute(pathname)) {
    return true;
  }
  if (!pathname.startsWith("/dashboard/conversations")) {
    return false;
  }
  return Boolean(searchParams?.get("employee"));
}

export function isMobilePrimaryActive(
  pathname: string,
  tab: MobilePrimaryTab,
): boolean {
  if (tab.id === "more" || !tab.href) return false;
  if (tab.id === "home") {
    return pathname === "/dashboard";
  }
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function isMobileMoreItemActive(
  pathname: string,
  search: string,
  item: MobileMoreItem,
): boolean {
  if (item.id === "billing") {
    return pathname === "/settings" && search.includes("tab=billing");
  }
  if (item.id === "settings") {
    return (
      pathname === "/settings" &&
      !search.includes("tab=billing")
    );
  }
  if (item.href.includes("?")) {
    return pathname + (search ? `?${search.replace(/^\?/, "")}` : "") === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

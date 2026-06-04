import type { CSSProperties } from "react";

export const DASHBOARD_SIDEBAR_WIDTH_EXPANDED = "280px";
export const DASHBOARD_SIDEBAR_WIDTH_COLLAPSED = "72px";
export const DASHBOARD_SIDEBAR_TRANSITION_DURATION = "175ms";

export type DashboardSidebarState = "expanded" | "collapsed";

export const dashboardSidebarCssVars = {
  "--sidebar-width": DASHBOARD_SIDEBAR_WIDTH_EXPANDED,
  "--sidebar-width-icon": DASHBOARD_SIDEBAR_WIDTH_COLLAPSED,
} as CSSProperties;

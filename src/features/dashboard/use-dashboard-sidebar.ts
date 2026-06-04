"use client";

import { useSidebar } from "@/components/ui/sidebar";
import type { DashboardSidebarState } from "./constants";

export function useDashboardSidebar(): {
  sidebarState: DashboardSidebarState;
  toggleSidebar: () => void;
} {
  const { state, toggleSidebar } = useSidebar();

  return {
    sidebarState: state as DashboardSidebarState,
    toggleSidebar,
  };
}

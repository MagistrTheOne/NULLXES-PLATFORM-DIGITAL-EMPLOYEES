"use client";

import { useDashboardSidebar } from "../use-dashboard-sidebar";

function LogoMark() {
  return (
    <div
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/4"
    >
      <span className="text-sm font-semibold tracking-tight text-white">N</span>
    </div>
  );
}

export function SidebarBrand() {
  const { sidebarState } = useDashboardSidebar();

  if (sidebarState === "collapsed") {
    return (
      <div className="flex w-full items-center justify-center py-1">
        <LogoMark />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark />
      <div className="min-w-0">
        <p className="text-xs tracking-[0.28em] text-white/50 uppercase">
          NULLXES
        </p>
        <p className="mt-1 text-sm font-medium whitespace-nowrap text-white">
          Digital Employees
        </p>
      </div>
    </div>
  );
}

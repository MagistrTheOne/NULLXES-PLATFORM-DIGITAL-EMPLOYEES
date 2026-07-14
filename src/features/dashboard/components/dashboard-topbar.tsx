"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isMobileTalkRoute } from "../lib/mobile-nav";

export function DashboardTopbar() {
  const pathname = usePathname();
  const talkRoute = isMobileTalkRoute(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-white/10 bg-black px-4 pt-[env(safe-area-inset-top)] md:px-6">
      {/* Desktop: sidebar collapse. Mobile: bottom nav owns navigation. */}
      <SidebarTrigger className="hidden text-white hover:bg-white/5 hover:text-white md:inline-flex" />
      {!talkRoute ? (
        <Link
          href="/dashboard"
          className="text-xs font-medium tracking-[0.22em] text-white/70 uppercase md:hidden"
        >
          NULLXES
        </Link>
      ) : null}
    </header>
  );
}

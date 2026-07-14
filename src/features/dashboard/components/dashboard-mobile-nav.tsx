"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Monitor } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  isMobileMoreItemActive,
  isMobilePrimaryActive,
  isMobileTalkRoute,
  MOBILE_MORE_ITEMS,
  MOBILE_PRIMARY_TABS,
} from "../lib/mobile-nav";

export function DashboardMobileNav({
  isPlatformAdmin,
}: {
  isPlatformAdmin: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const t = useTranslations("common.mobileNav");
  const tNav = useTranslations("common.nav");
  const [moreOpen, setMoreOpen] = useState(false);

  if (isMobileTalkRoute(pathname)) {
    return null;
  }

  const moreItems = MOBILE_MORE_ITEMS.filter(
    (item) => !item.adminOnly || isPlatformAdmin,
  );

  const moreActive = moreItems.some((item) =>
    isMobileMoreItemActive(pathname, search, item),
  );

  return (
    <>
      <nav
        aria-label={t("ariaLabel")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0a0a]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-4">
          {MOBILE_PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isMore = tab.id === "more";
            const active = isMore
              ? moreOpen || moreActive
              : isMobilePrimaryActive(pathname, tab);

            if (isMore) {
              return (
                <li key={tab.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className={cn(
                      "flex h-full min-h-16 w-full flex-col items-center justify-center gap-1 px-1 text-[10px] tracking-wide transition-colors",
                      active
                        ? "text-white"
                        : "text-white/45 active:text-white/80",
                    )}
                  >
                    <Icon className="size-5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{t(tab.labelKey)}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={tab.id} className="min-w-0">
                <Link
                  href={tab.href!}
                  className={cn(
                    "flex h-full min-h-16 w-full flex-col items-center justify-center gap-1 px-1 text-[10px] tracking-wide transition-colors",
                    active
                      ? "text-white"
                      : "text-white/45 active:text-white/80",
                  )}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{t(tab.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-2xl border-white/10 bg-[#121212] text-white md:hidden"
        >
          <SheetHeader className="border-b border-white/8 pb-4 text-left">
            <SheetTitle className="text-white">{t("moreTitle")}</SheetTitle>
            <SheetDescription className="text-white/45">
              {t("moreDescription")}
            </SheetDescription>
          </SheetHeader>

          <ul className="mt-2 space-y-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = isMobileMoreItemActive(pathname, search, item);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-3 transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/75 active:bg-white/5",
                    )}
                  >
                    <Icon className="size-5 shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 text-sm">
                      {tNav(item.labelKey)}
                    </span>
                    {item.desktopHint ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-white/35">
                        <Monitor className="size-3" />
                        {t("desktopHint")}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}

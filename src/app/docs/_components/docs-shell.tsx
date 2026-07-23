"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ChevronRight,
  Code2,
  LifeBuoy,
  Menu,
  Search,
  X,
} from "lucide-react";
import { DOCS_NAV, DOCS_NAV_FLAT, findDocsNavItem } from "../_lib/docs-nav";
import { DOCS_CORPUS } from "../_lib/docs-corpus";

const DOCS_VERSION = "2.1.0";

function NavList({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const tNav = useTranslations("docs.nav");
  const tShell = useTranslations("docs.shell");
  const normalized = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!normalized) {
      return DOCS_NAV;
    }

    const corpusHits = new Set(
      DOCS_CORPUS.filter((chunk) => {
        const hay =
          `${chunk.title} ${chunk.keywords.join(" ")} ${chunk.body}`.toLowerCase();
        return hay.includes(normalized);
      }).map((chunk) => chunk.href.split("#")[0]),
    );

    return DOCS_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const label = tNav(`items.${item.key}.label`).toLowerCase();
        return label.includes(normalized) || corpusHits.has(item.href);
      }),
    })).filter((group) => group.items.length > 0);
  }, [normalized, tNav]);

  if (groups.length === 0) {
    const flatHits = DOCS_NAV_FLAT.filter((item) =>
      tNav(`items.${item.key}.label`).toLowerCase().includes(normalized),
    );
    if (flatHits.length === 0) {
      return (
        <p className="px-3 py-4 text-sm text-white/40">{tShell("nothingFound")}</p>
      );
    }
  }

  return (
    <nav className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/30">
            {tNav(`groups.${group.key}`)}
          </p>
          <ul className="mt-1 flex flex-col">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={`${group.key}-${item.key}`}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {tNav(`items.${item.key}.label`)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tNav = useTranslations("docs.nav");
  const tShell = useTranslations("docs.shell");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeItem = findDocsNavItem(pathname);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 lg:flex">
          <div className="border-b border-white/10 px-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.28em] text-white/50 uppercase">
                NULLXES
              </span>
            </Link>
            <p className="mt-0.5 text-[13px] font-medium tracking-tight">
              Digital Employees
            </p>
            <Link
              href="/dashboard"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-white/40 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3" />
              {tShell("backToPlatform")}
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <NavList query={query} />
          </div>
          <div className="border-t border-white/10 px-4 py-3">
            <Link
              href="/trust"
              className="flex items-center gap-2 text-[11px] text-white/45 transition-colors hover:text-white"
            >
              <span className="size-1.5 rounded-full bg-white/60" />
              {tShell("platformOnline")}
            </Link>
          </div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              aria-label={tShell("closeMenu")}
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col border-r border-white/10 bg-black">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-sm font-medium">
                  {tShell("documentation")}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-1 text-white/60 hover:bg-white/5 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-4">
                <NavList
                  query={query}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
              <button
                type="button"
                className="rounded-md border border-white/10 p-1.5 text-white/70 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label={tShell("openMenu")}
              >
                <Menu className="size-4" />
              </button>
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tShell("searchPlaceholder")}
                  className="w-full rounded-md border border-white/10 bg-[#111111] py-1.5 pl-8 pr-3 text-[13px] text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none"
                />
              </div>
              <Link
                href="/docs/api"
                className="ml-auto hidden items-center gap-1.5 text-[13px] text-white/60 transition-colors hover:text-white sm:inline-flex"
              >
                <Code2 className="size-3.5" />
                API
              </Link>
              <Link
                href="/docs/assistant"
                className="hidden items-center gap-1.5 text-[13px] text-white/60 transition-colors hover:text-white md:inline-flex"
              >
                Yuki
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-[13px] text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="size-3.5" />
                {tShell("home")}
              </Link>
            </div>
          </header>

          <div className="flex min-w-0 flex-1">
            <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 xl:px-9">
              {activeItem ? (
                <nav className="mb-5 flex items-center gap-1.5 text-xs text-white/40">
                  <Link href="/docs" className="hover:text-white">
                    {tShell("documentation")}
                  </Link>
                  <ChevronRight className="size-3.5" />
                  <span className="text-white/70">
                    {tNav(`items.${activeItem.key}.breadcrumb`)}
                  </span>
                </nav>
              ) : null}
              <div className="max-w-3xl">{children}</div>
            </main>

            <aside className="sticky top-[45px] hidden h-[calc(100vh-45px)] w-60 shrink-0 flex-col gap-5 overflow-y-auto border-l border-white/10 px-5 py-7 xl:flex">
              {activeItem && activeItem.toc.length > 0 ? (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/30">
                    {tShell("onThisPage")}
                  </p>
                  <ul className="mt-2.5 flex flex-col gap-1.5">
                    {activeItem.toc.map((entry) => (
                      <li key={entry.id}>
                        <a
                          href={`#${entry.id}`}
                          className="block text-[13px] text-white/55 transition-colors hover:text-white"
                        >
                          {tNav(
                            `items.${activeItem.key}.toc.${entry.labelKey}`,
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
                <LifeBuoy className="size-4 text-white/50" />
                <p className="mt-2.5 text-[13px] font-medium text-white">
                  {tShell("needHelp")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  {tShell("helpBody")}
                </p>
                <div className="mt-3 flex flex-col gap-2 text-xs">
                  <Link
                    href="/docs/assistant"
                    className="text-white underline underline-offset-4"
                  >
                    Yuki Nakora
                  </Link>
                  <Link
                    href="/docs/enterprise"
                    className="text-white underline underline-offset-4"
                  >
                    Enterprise
                  </Link>
                  <Link
                    href="/docs/limits"
                    className="text-white underline underline-offset-4"
                  >
                    {tShell("limitsLink")}
                  </Link>
                  <a
                    href="mailto:ceo@nullxes.com"
                    className="text-white/70 underline underline-offset-4"
                  >
                    ceo@nullxes.com
                  </a>
                </div>
              </div>

              <div className="text-xs text-white/40">
                <p>
                  {tShell("docsVersion")}{" "}
                  <span className="text-white/70">{DOCS_VERSION}</span>
                </p>
                <p className="mt-1">
                  {tShell("lastUpdated")}{" "}
                  <span className="text-white/70">{tShell("updatedAt")}</span>
                </p>
                <p className="mt-2">
                  <Link href="/llms.txt" className="text-white/55 hover:text-white">
                    /llms.txt
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

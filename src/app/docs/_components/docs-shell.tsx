"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Code2,
  LifeBuoy,
  Search,
} from "lucide-react";
import { DOCS_NAV, findDocsNavItem } from "../_lib/docs-nav";

const DOCS_VERSION = "1.0.0";
const DOCS_UPDATED = "30 июн. 2026 г.";

function NavList({ query }: { query: string }) {
  const pathname = usePathname();
  const normalized = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!normalized) {
      return DOCS_NAV;
    }
    return DOCS_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(normalized),
      ),
    })).filter((group) => group.items.length > 0);
  }, [normalized]);

  if (groups.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-white/40">Ничего не найдено.</p>
    );
  }

  return (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs uppercase tracking-wide text-white/35">
            {group.label}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
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
  const [query, setQuery] = useState("");
  const activeItem = findDocsNavItem(pathname);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-white/10 lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xs tracking-[0.3em] text-white/50 uppercase">
                NULLXES
              </span>
            </Link>
            <p className="mt-1 text-sm font-medium tracking-tight">
              Digital Employees
            </p>
            <Link
              href="/dashboard"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              На платформу
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-5">
            <NavList query={query} />
          </div>
          <div className="border-t border-white/10 px-5 py-4">
            <Link
              href="/trust"
              className="flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-white"
            >
              <span className="size-2 rounded-full bg-white/60" />
              Платформа · онлайн
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur">
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Поиск в документации..."
                  className="w-full rounded-lg border border-white/10 bg-[#111111] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none"
                />
              </div>
              <Link
                href="/api/docs"
                className="ml-auto inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
              >
                <Code2 className="size-4" />
                API Reference
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="size-4" />
                Домой
              </Link>
            </div>
          </header>

          <div className="flex min-w-0 flex-1">
            <main className="min-w-0 flex-1 px-6 py-10 xl:px-10">
              {activeItem ? (
                <nav className="mb-6 flex items-center gap-1.5 text-xs text-white/40">
                  <Link href="/docs" className="hover:text-white">
                    Документация
                  </Link>
                  <ChevronRight className="size-3.5" />
                  <span className="text-white/70">{activeItem.breadcrumb}</span>
                </nav>
              ) : null}
              <div className="max-w-3xl">{children}</div>
            </main>

            {/* Right rail */}
            <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 shrink-0 flex-col gap-6 overflow-y-auto border-l border-white/10 px-5 py-10 xl:flex">
              {activeItem && activeItem.toc.length > 0 ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/35">
                    На этой странице
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {activeItem.toc.map((entry) => (
                      <li key={entry.id}>
                        <a
                          href={`#${entry.id}`}
                          className="block text-sm text-white/55 transition-colors hover:text-white"
                        >
                          {entry.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                <LifeBuoy className="size-5 text-white/50" />
                <p className="mt-3 text-sm font-medium text-white">
                  Нужна помощь?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Если у вас есть вопросы по документации или продукту,
                  обратитесь в поддержку.
                </p>
                <Link
                  href="/trust"
                  className="mt-3 inline-block text-xs text-white underline underline-offset-4"
                >
                  Центр доверия
                </Link>
              </div>

              <div className="text-xs text-white/40">
                <p>
                  Версия документации:{" "}
                  <span className="text-white/70">{DOCS_VERSION}</span>
                </p>
                <p className="mt-1">
                  Последнее обновление:{" "}
                  <span className="text-white/70">{DOCS_UPDATED}</span>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

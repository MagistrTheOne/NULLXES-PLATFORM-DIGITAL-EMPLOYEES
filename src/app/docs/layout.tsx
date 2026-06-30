import Link from "next/link";
import type { ReactNode } from "react";

const DOC_LINKS = [
  { href: "/docs", label: "Обзор" },
  { href: "/docs/functional", label: "Функциональные характеристики" },
  { href: "/docs/installation", label: "Установка" },
  { href: "/docs/operation", label: "Эксплуатация" },
] as const;

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
              NULLXES Digital Employees
            </p>
            <h1 className="mt-1 text-lg font-medium tracking-tight">
              Документация программного обеспечения
            </h1>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {DOC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/60 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/trust"
              className="text-white/60 transition-colors hover:text-white"
            >
              Trust Center
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#platform", label: "Platform" },
  { href: "#use-case", label: "Solutions" },
  { href: "#enterprise", label: "Enterprise" },
  { href: "#security", label: "Security" },
  { href: "#pricing", label: "Pricing" },
] as const;

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300",
        scrolled || menuOpen
          ? "border-b border-white/10 bg-black/75 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          : "border-b border-transparent bg-black/20 backdrop-blur-md",
      )}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4 md:px-10 lg:px-14">
        <Link
          href="/"
          className="font-(family-name:--font-landing-serif) text-sm tracking-[0.35em] text-white uppercase"
          onClick={() => setMenuOpen(false)}
        >
          NULLXES
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[13px] text-white/70 lg:flex xl:gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full border border-(--landing-gold)/70 bg-black/30 px-3 py-2 text-[11px] tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10 sm:px-4 sm:text-xs"
            >
              Go to dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-(--landing-gold)/70 bg-black/30 px-3 py-2 text-[11px] tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10 sm:px-4 sm:text-xs"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-white/8 bg-black/80 px-5 py-4 backdrop-blur-xl lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-xl px-3 py-3 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

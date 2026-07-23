"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LandingLocaleSwap } from "./landing-locale-swap";

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("landing.nav");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#platform", label: t("platform") },
    { href: "#use-case", label: t("solutions") },
    { href: "#enterprise", label: t("enterprise") },
    { href: "#security", label: t("security") },
    { href: "#pricing", label: t("pricing") },
  ] as const;

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "landing-nav-reveal fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300",
        scrolled || menuOpen
          ? "border-b border-white/10 bg-black/75 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          : "border-b border-transparent bg-black/20 backdrop-blur-md",
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 sm:gap-4 sm:px-6 sm:py-4 md:px-10 lg:px-14">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <LandingLocaleSwap />
          <Link
            href="/"
            className="font-(family-name:--font-landing-serif) text-sm tracking-[0.35em] text-white uppercase"
            onClick={() => setMenuOpen(false)}
          >
            NULLXES ENTERPRISE
          </Link>
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[13px] text-white/70 lg:flex xl:gap-8">
          {navLinks.map((link) => (
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
              className="hidden rounded-full border border-(--landing-gold)/70 bg-black/30 px-3 py-2 text-[11px] tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10 sm:inline-flex sm:px-4 sm:text-xs"
            >
              {t("goDashboard")}
            </Link>
          ) : (
            <Link
              href="/register"
              className="hidden rounded-full border border-(--landing-gold)/70 bg-black/30 px-3 py-2 text-[11px] tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10 sm:inline-flex sm:px-4 sm:text-xs"
            >
              {t("requestAccess")}
            </Link>
          )}

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
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

      <div
        className={cn(
          "overflow-hidden border-t border-white/8 bg-black/90 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out lg:hidden",
          menuOpen
            ? "max-h-[70vh] opacity-100"
            : "pointer-events-none max-h-0 border-transparent opacity-0",
        )}
        aria-hidden={!menuOpen}
      >
        <nav className="px-5 py-4 sm:px-6">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
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

          <div className="mt-3 border-t border-white/8 pt-3 sm:hidden">
            {signedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center rounded-full border border-(--landing-gold)/70 bg-black/30 px-4 py-3 text-xs tracking-wide text-(--landing-gold)"
              >
                {t("goDashboard")}
              </Link>
            ) : (
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center rounded-full border border-(--landing-gold)/70 bg-black/30 px-4 py-3 text-xs tracking-wide text-(--landing-gold)"
              >
                {t("requestAccess")}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

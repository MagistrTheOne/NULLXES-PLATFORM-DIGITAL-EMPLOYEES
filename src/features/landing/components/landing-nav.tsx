"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300",
        scrolled
          ? "border-b border-white/10 bg-black/70 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          : "border-b border-transparent bg-black/20 backdrop-blur-md",
      )}
    >
      <div className="flex items-center justify-between gap-6 px-6 py-4 md:px-10 lg:px-14">
        <Link
          href="/"
          className="font-(family-name:--font-landing-serif) text-sm tracking-[0.35em] text-white uppercase"
        >
          NULLXES
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[13px] text-white/70 md:flex">
          <a
            href="#platform"
            className="transition-colors hover:text-white"
          >
            Platform
          </a>
          <a
            href="#use-case"
            className="transition-colors hover:text-white"
          >
            Solutions
          </a>
          <a
            href="#enterprise"
            className="transition-colors hover:text-white"
          >
            Enterprise
          </a>
          <a
            href="#security"
            className="transition-colors hover:text-white"
          >
            Security
          </a>
          <a
            href="#pricing"
            className="transition-colors hover:text-white"
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full border border-(--landing-gold)/70 bg-black/30 px-4 py-2 text-xs tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10"
            >
              Go to dashboard
            </Link>
          ) : (
            <Link
              href="/register"
              className="rounded-full border border-(--landing-gold)/70 bg-black/30 px-4 py-2 text-xs tracking-wide text-(--landing-gold) transition-colors hover:bg-(--landing-gold)/10"
            >
              Request access
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export type LandingRow = {
  id: string;
  number: string;
  title: string;
  body: string;
};

export function LandingRowsSection({
  id,
  label,
  headline,
  headlineLines,
  rows,
  ctaHref,
  ctaLabel,
}: {
  id: string;
  label: string;
  headline?: string;
  headlineLines?: string[];
  rows: readonly LandingRow[];
  ctaHref: string;
  ctaLabel: string;
}) {
  const [activeId, setActiveId] = useState<string>(rows[0]?.id ?? "");
  const active = rows.find((item) => item.id === activeId) ?? rows[0];

  return (
    <section
      id={id}
      className="relative flex min-h-dvh flex-col justify-center border-t border-white/10 px-6 py-16 md:px-10 lg:px-14 lg:py-0"
    >
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
          {label}
        </p>
        <h2 className="mt-4 max-w-xl font-(family-name:--font-landing-serif) text-3xl leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
          {headlineLines
            ? headlineLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))
            : headline}
        </h2>

        <ul className="mt-12 border-t border-white/10">
          {rows.map((item) => {
            const isActive = item.id === active?.id;
            return (
              <li key={item.id} className="border-b border-white/10">
                <button
                  type="button"
                  onMouseEnter={() => setActiveId(item.id)}
                  onFocus={() => setActiveId(item.id)}
                  className="group grid w-full grid-cols-[3rem_minmax(0,1fr)] gap-4 py-6 text-left transition-colors sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-6"
                >
                  <span
                    className={`pt-1 text-[11px] tracking-[0.2em] ${
                      isActive
                        ? "text-(--landing-gold)"
                        : "text-white/35 group-hover:text-white/55"
                    }`}
                  >
                    {item.number}
                  </span>
                  <span>
                    <span
                      className={`block text-lg tracking-tight sm:text-xl ${
                        isActive ? "text-white" : "text-white/70"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span
                      className={`mt-2 block max-w-xl text-sm leading-relaxed ${
                        isActive ? "text-white/55" : "text-white/35"
                      }`}
                    >
                      {item.body}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-10">
          <Link
            href={ctaHref}
            className="inline-flex text-sm text-(--landing-gold) transition-opacity hover:opacity-80"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

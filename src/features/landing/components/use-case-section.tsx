"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";

const CASES = [
  {
    id: "client-operations",
    number: "01",
    title: "Client Operations",
    body: "A digital employee handles incoming conversations across your approved channels.",
    reveal: "portrait" as const,
  },
  {
    id: "knowledge-access",
    number: "02",
    title: "Knowledge Access",
    body: "Policies, services and operational context are available in one accountable interaction.",
    reveal: "portrait" as const,
  },
  {
    id: "executive-presence",
    number: "03",
    title: "Executive Presence",
    body: "A visible digital representative for high-stakes conversations and public-facing work.",
    reveal: "talk" as const,
  },
] as const;

export function UseCaseSection({
  signedIn,
  plaque,
}: {
  signedIn: boolean;
  plaque: AdelineLandingPlaque;
}) {
  const [activeId, setActiveId] = useState<string | null>(CASES[0].id);
  const active = CASES.find((item) => item.id === activeId) ?? CASES[0];
  const portrait =
    plaque.avatarPreviewUrl ?? "/marketing/adeline-kalen.jpg";

  return (
    <section
      id="use-case"
      className="relative flex min-h-dvh flex-col justify-center border-t border-white/10 px-6 py-16 md:px-10 lg:px-14 lg:py-0"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.75fr)] lg:items-center lg:gap-16">
        <div>
          <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
            Use cases
          </p>
          <h2 className="mt-4 max-w-xl font-(family-name:--font-landing-serif) text-3xl leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            The digital frontline.
            <br />
            Built for real operations.
          </h2>

          <ul className="mt-12 border-t border-white/10">
            {CASES.map((item) => {
              const isActive = item.id === active.id;
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

          <div className="mt-10" id="security">
            <Link
              href={signedIn ? "/dashboard" : "/register"}
              className="inline-flex text-sm text-(--landing-gold) transition-opacity hover:opacity-80"
            >
              {signedIn ? "Go to dashboard →" : "Talk to sales →"}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-[320px] lg:block">
          <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#0a0a0a]">
            <div className="relative aspect-4/5">
              <Image
                src={portrait}
                alt={plaque.name}
                fill
                className={`object-cover transition-opacity duration-500 ${
                  active.reveal === "talk" ? "opacity-70" : "opacity-100"
                }`}
                sizes="320px"
              />
              {active.reveal === "talk" ? (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/70 to-transparent px-5 pb-5 pt-16">
                  <p className="text-[11px] tracking-[0.22em] text-(--landing-gold) uppercase">
                    Talk frame
                  </p>
                  <p className="mt-2 text-sm text-white">{plaque.name}</p>
                  <p className="mt-1 text-xs text-white/45">
                    Live conversation surface — voice, context, presence.
                  </p>
                </div>
              ) : (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-5 pb-5 pt-12">
                  <p className="text-sm text-white">{plaque.name}</p>
                  <p className="mt-1 text-xs text-(--landing-gold)">
                    Digital Executive
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

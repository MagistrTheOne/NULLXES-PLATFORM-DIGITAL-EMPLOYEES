import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdelinePlaque } from "./adeline-plaque";
import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";

export function AdelineHero({
  signedIn,
  plaque,
}: {
  signedIn: boolean;
  plaque: AdelineLandingPlaque;
}) {
  return (
    <section
      id="platform"
      className="relative grid min-h-0 flex-1 items-center gap-10 px-6 pb-8 pt-2 md:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.9fr)] lg:gap-14 lg:px-14 lg:pb-10"
    >
      <div className="relative z-10 max-w-xl">
        <p className="inline-block border-b border-(--landing-gold) pb-1 text-[11px] font-medium tracking-[0.28em] text-(--landing-gold) uppercase">
          Enterprise Digital Employees
        </p>

        <h1 className="mt-6 font-(family-name:--font-landing-serif) text-[2.4rem] leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
          One platform.
          <br />
          Every digital employee.
        </h1>

        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/55">
          Create, deploy, and manage digital employees for customer support,
          operations, HR, and public services — with enterprise-grade security,
          governance, and complete organizational control.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-(--landing-gold) px-5 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              Open dashboard
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-(--landing-gold) px-5 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
              >
                Request enterprise access
                <ArrowRight className="size-4" />
              </Link>

              <a
                href="#use-case"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm text-white/80 transition-colors hover:border-white/35 hover:text-white"
              >
                Explore capabilities
                <ArrowRight className="size-4 opacity-70" />
              </a>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[360px] lg:mx-0 lg:justify-self-end">
        <AdelinePlaque plaque={plaque} signedIn={signedIn} />
      </div>
    </section>
  );
}

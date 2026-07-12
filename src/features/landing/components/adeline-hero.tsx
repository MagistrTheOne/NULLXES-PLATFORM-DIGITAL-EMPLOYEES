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
      className="relative grid min-h-0 flex-1 items-center gap-8 px-5 pb-10 pt-2 sm:gap-10 sm:px-6 md:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.9fr)] lg:gap-14 lg:px-14 lg:pb-10"
    >
      <div className="relative z-10 mx-auto w-full max-w-xl lg:mx-0">
        <p className="inline-block border-b border-(--landing-gold) pb-1 text-[10px] font-medium tracking-[0.24em] text-(--landing-gold) uppercase sm:text-[11px] sm:tracking-[0.28em]">
          Enterprise Digital Employees
        </p>

        <h1 className="mt-5 font-(family-name:--font-landing-serif) text-[2.05rem] leading-[1.08] tracking-tight text-white sm:mt-6 sm:text-5xl lg:text-[3.25rem]">
          One platform.
          <br />
          Every digital employee.
        </h1>

        <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-white/55 sm:mt-5 sm:text-[15px]">
          Create, deploy, and manage digital employees for customer support,
          operations, HR, and public services — with enterprise-grade security,
          governance, and complete organizational control.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
          {!signedIn ? (
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
          ) : (
            <a
              href="#use-case"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm text-white/80 transition-colors hover:border-white/35 hover:text-white"
            >
              Explore capabilities
              <ArrowRight className="size-4 opacity-70" />
            </a>
          )}
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:mx-0 lg:max-w-[360px] lg:justify-self-end">
        <AdelinePlaque plaque={plaque} signedIn={signedIn} />
      </div>
    </section>
  );
}

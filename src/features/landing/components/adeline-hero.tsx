"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { AdelinePlaque } from "./adeline-plaque";
import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";

function openAdelineTalk() {
  const plaque = document.getElementById("adeline-landing-plaque");
  plaque?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  const talk = document.querySelector<HTMLButtonElement>("[data-adeline-talk]");
  window.setTimeout(() => {
    talk?.click();
  }, plaque ? 280 : 0);
}

export function AdelineHero({
  signedIn,
  plaque,
}: {
  signedIn: boolean;
  plaque: AdelineLandingPlaque;
}) {
  const t = useTranslations("landing.hero");

  return (
    <section
      id="platform"
      className="relative grid min-h-0 flex-1 items-center gap-8 px-5 pb-10 pt-2 sm:gap-10 sm:px-6 md:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.9fr)] lg:gap-14 lg:px-14 lg:pb-10"
    >
      <div className="relative z-10 mx-auto w-full max-w-xl lg:mx-0">
        <p className="landing-reveal landing-reveal-1 inline-block border-b border-white/40 pb-1 text-[10px] font-medium tracking-[0.28em] text-white/70 uppercase sm:text-[11px]">
          {t("eyebrow")}
        </p>

        <h1 className="landing-reveal landing-reveal-2 mt-5 font-(family-name:--font-landing-serif) text-[2.25rem] leading-[1.02] tracking-tight text-white sm:mt-6 sm:text-5xl lg:text-[3.5rem]">
          {t("titleLine1")}
          <br />
          {t("titleLine2")}
        </h1>

        <p className="landing-reveal landing-reveal-3 mt-4 max-w-lg text-[15px] leading-snug text-white/60 sm:mt-5 sm:text-base">
          {t("body")}
        </p>

        <div className="landing-reveal landing-reveal-4 mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
          <a
            href="#use-case"
            className="inline-flex items-center gap-2 border border-white/30 px-5 py-3 text-sm text-white/90 transition-colors hover:border-white/50 hover:text-white"
          >
            {t("explore")}
            <ArrowRight className="size-4 opacity-70" />
          </a>

          <button
            type="button"
            onClick={openAdelineTalk}
            className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            {t("oneTapTalk")}
          </button>
        </div>
      </div>

      {/* Adeline plaque: no entrance motion — frozen composition */}
      <div
        id="adeline-landing-plaque"
        className="relative z-10 mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:mx-0 lg:max-w-[360px] lg:justify-self-end"
      >
        <AdelinePlaque plaque={plaque} signedIn={signedIn} />
      </div>
    </section>
  );
}

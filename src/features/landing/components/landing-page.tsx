import type { CSSProperties } from "react";
import { Cormorant_Garamond } from "next/font/google";
import { LandingNav } from "./landing-nav";
import { AdelineHero } from "./adeline-hero";
import { UseCaseSection } from "./use-case-section";
import { EnterpriseSection } from "./enterprise-section";
import { SecuritySection } from "./security-section";
import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";

const landingSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-landing-serif",
});

const landingVars = {
  "--landing-gold": "#C4A574",
} as CSSProperties;

export function LandingPage({
  signedIn,
  plaque,
}: {
  signedIn: boolean;
  plaque: AdelineLandingPlaque;
}) {
  return (
    <div
      className={`${landingSerif.variable} relative overflow-x-hidden bg-black text-white`}
      style={landingVars}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/3 h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,165,116,0.14)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,transparent_42%)]" />
      </div>

      <div className="relative flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
        <LandingNav signedIn={signedIn} />
        <AdelineHero signedIn={signedIn} plaque={plaque} />
      </div>

      <div className="relative">
        <UseCaseSection signedIn={signedIn} plaque={plaque} />
      </div>

      <div className="relative">
        <EnterpriseSection signedIn={signedIn} plaque={plaque} />
      </div>

      <div className="relative">
        <SecuritySection signedIn={signedIn} plaque={plaque} />
      </div>

      <style>{`
        @keyframes landing-wave {
          0%, 100% { transform: scaleY(0.45); opacity: 0.65; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

"use client";

import { ADELINE_MARKETING_PORTRAIT } from "../lib/adeline-marketing";
import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";
import { LandingRowsSection } from "./landing-rows-section";

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
  return (
    <LandingRowsSection
      id="use-case"
      label="Use cases"
      headlineLines={[
        "The digital frontline.",
        "Built for real operations.",
      ]}
      rows={CASES}
      portraitSrc={ADELINE_MARKETING_PORTRAIT}
      portraitName={plaque.name}
      ctaHref={signedIn ? "/dashboard" : "/register"}
      ctaLabel={signedIn ? "Go to dashboard →" : "Talk to sales →"}
    />
  );
}

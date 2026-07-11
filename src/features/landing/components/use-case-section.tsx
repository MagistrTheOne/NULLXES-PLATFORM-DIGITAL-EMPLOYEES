"use client";

import { LandingRowsSection } from "./landing-rows-section";

const CASES = [
  {
    id: "client-operations",
    number: "01",
    title: "Client Operations",
    body: "A digital employee handles incoming conversations across your approved channels.",
  },
  {
    id: "knowledge-access",
    number: "02",
    title: "Knowledge Access",
    body: "Policies, services and operational context are available in one accountable interaction.",
  },
  {
    id: "executive-presence",
    number: "03",
    title: "Executive Presence",
    body: "A visible digital representative for high-stakes conversations and public-facing work.",
  },
] as const;

export function UseCaseSection({ signedIn }: { signedIn: boolean }) {
  return (
    <LandingRowsSection
      id="use-case"
      label="Use cases"
      headlineLines={[
        "The digital frontline.",
        "Built for real operations.",
      ]}
      rows={CASES}
      ctaHref={signedIn ? "/dashboard" : "/register"}
      ctaLabel={signedIn ? "Go to dashboard →" : "Talk to sales →"}
    />
  );
}

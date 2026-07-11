"use client";

import { LandingRowsSection } from "./landing-rows-section";

const ROWS = [
  {
    id: "identity-access",
    number: "01",
    title: "Identity & access",
    body: "Workspace roles, invites, and step-up auth keep the floor gated.",
  },
  {
    id: "keys-boundaries",
    number: "02",
    title: "Keys & boundaries",
    body: "API keys, IP allowlists, and outbound webhooks stay under org control.",
  },
  {
    id: "session-discipline",
    number: "03",
    title: "Session discipline",
    body: "Talk limits, plan budgets, and auditable session lifecycle — not an open mic to the model.",
  },
] as const;

export function SecuritySection({ signedIn }: { signedIn: boolean }) {
  return (
    <LandingRowsSection
      id="security"
      label="Security"
      headline="Trust is the product surface."
      rows={ROWS}
      ctaHref={signedIn ? "/dashboard" : "/register"}
      ctaLabel={signedIn ? "Go to dashboard →" : "Talk to sales →"}
    />
  );
}

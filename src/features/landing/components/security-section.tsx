"use client";

import { ADELINE_MARKETING_PORTRAIT } from "../lib/adeline-marketing";
import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";
import { LandingRowsSection } from "./landing-rows-section";

const ROWS = [
  {
    id: "identity-access",
    number: "01",
    title: "Identity & access",
    body: "Workspace roles, invites, and step-up auth keep the floor gated.",
    reveal: "portrait" as const,
  },
  {
    id: "keys-boundaries",
    number: "02",
    title: "Keys & boundaries",
    body: "API keys, IP allowlists, and outbound webhooks stay under org control.",
    reveal: "portrait" as const,
  },
  {
    id: "session-discipline",
    number: "03",
    title: "Session discipline",
    body: "Talk limits, plan budgets, and auditable session lifecycle — not an open mic to the model.",
    reveal: "talk" as const,
  },
] as const;

export function SecuritySection({
  signedIn,
  plaque,
}: {
  signedIn: boolean;
  plaque: AdelineLandingPlaque;
}) {
  return (
    <LandingRowsSection
      id="security"
      label="Security"
      headline="Trust is the product surface."
      rows={ROWS}
      portraitSrc={ADELINE_MARKETING_PORTRAIT}
      portraitName={plaque.name}
      ctaHref={signedIn ? "/dashboard" : "/register"}
      ctaLabel={signedIn ? "Go to dashboard →" : "Talk to sales →"}
    />
  );
}

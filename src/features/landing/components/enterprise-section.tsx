"use client";

import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";
import { LandingRowsSection } from "./landing-rows-section";

const ROWS = [
  {
    id: "controlled-deployment",
    number: "01",
    title: "Controlled deployment",
    body: "Digital employees launch inside your org boundaries — roles, channels, and approval paths stay explicit.",
    reveal: "portrait" as const,
  },
  {
    id: "operational-continuity",
    number: "02",
    title: "Operational continuity",
    body: "First contact, routine questions, and handoffs keep moving when the human floor is offline.",
    reveal: "portrait" as const,
  },
  {
    id: "accountable-presence",
    number: "03",
    title: "Accountable presence",
    body: "Every interaction is attributable: who spoke, what knowledge was used, what requires a human.",
    reveal: "talk" as const,
  },
] as const;

export function EnterpriseSection({
  signedIn,
  plaque,
}: {
  signedIn: boolean;
  plaque: AdelineLandingPlaque;
}) {
  return (
    <LandingRowsSection
      id="enterprise"
      label="Enterprise"
      headline="Built for institutions that cannot afford a wrong answer."
      rows={ROWS}
      portraitSrc={
        plaque.avatarPreviewUrl ?? "/marketing/adeline-kalen.jpg"
      }
      portraitName={plaque.name}
      ctaHref={signedIn ? "/dashboard" : "/register"}
      ctaLabel={signedIn ? "Go to dashboard →" : "Talk to sales →"}
    />
  );
}

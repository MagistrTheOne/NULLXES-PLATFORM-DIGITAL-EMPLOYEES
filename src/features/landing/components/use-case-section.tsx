"use client";

import { LandingRowsSection } from "./landing-rows-section";

const CASES = [
  {
    id: "customer-support",
    number: "01",
    title: "Customer Support",
    body: "Digital employees answer customer requests, resolve routine cases, and escalate complex conversations when required.",
  },
  {
    id: "internal-operations",
    number: "02",
    title: "Internal Operations",
    body: "Provide employees with instant access to internal knowledge, policies, documentation, and operational procedures.",
  },
  {
    id: "public-services",
    number: "03",
    title: "Public Services",
    body: "Deploy digital employees for government services, public reception, enterprise front desks, and information centers.",
  },
] as const;

export function UseCaseSection() {
  return (
    <LandingRowsSection
      id="use-case"
      label="Use Cases"
      headlineLines={[
        "Digital employees.",
        "Ready for enterprise deployment.",
      ]}
      rows={CASES}
    />
  );
}

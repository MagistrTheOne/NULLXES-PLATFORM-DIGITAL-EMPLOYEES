import Link from "next/link";

/** USD ranges converted from RUB enterprise quotes (~80 ₽ / $1). */
const PRICING_ROWS = [
  {
    id: "discovery",
    service: "Executive Discovery / strategic session (up to 2 hours)",
    price: "$4,000 – $6,000",
  },
  {
    id: "audit",
    service: "Enterprise AI Audit",
    price: "$19,000 – $38,000",
  },
  {
    id: "architecture",
    service: "Solution architecture & implementation roadmap",
    price: "$38,000 – $88,000",
  },
  {
    id: "poc",
    service: "PoC / single-scenario prototype",
    price: "$60,000 – $150,000",
  },
  {
    id: "pilot",
    service: "Pilot in one business unit",
    price: "$150,000 – $375,000",
  },
  {
    id: "deployment",
    service: "Enterprise deployment",
    price: "$375,000 – $1.25M+",
  },
  {
    id: "private",
    service: "Private / on-prem perimeter, security, integrations",
    price: "from $625,000",
  },
  {
    id: "license",
    service: "License / platform / SLA",
    price: "from $125,000 – $375,000 / year",
  },
] as const;

export function PricingSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section
      id="pricing"
      className="relative flex min-h-dvh flex-col justify-center border-t border-white/10 px-6 py-16 md:px-10 lg:px-14 lg:py-0"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
          Pricing
        </p>
        <h2 className="mt-4 max-w-2xl font-(family-name:--font-landing-serif) text-3xl leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
          Engagements sized for enterprise outcomes.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">
          Indicative USD ranges for NULLXES professional services and platform
          licensing. Final scope is scoped per organization.
        </p>

        <div className="mt-12 border-t border-white/10">
          {PRICING_ROWS.map((row) => (
            <div
              key={row.id}
              className="grid gap-2 border-b border-white/10 py-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] sm:items-baseline sm:gap-8"
            >
              <p className="text-[15px] leading-snug tracking-tight text-white/85">
                {row.service}
              </p>
              <p className="font-mono text-sm tabular-nums text-(--landing-gold) sm:text-right">
                {row.price}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href={signedIn ? "/dashboard" : "/register"}
            className="inline-flex text-sm text-(--landing-gold) transition-opacity hover:opacity-80"
          >
            {signedIn ? "Go to dashboard →" : "Talk to sales →"}
          </Link>
        </div>
      </div>
    </section>
  );
}

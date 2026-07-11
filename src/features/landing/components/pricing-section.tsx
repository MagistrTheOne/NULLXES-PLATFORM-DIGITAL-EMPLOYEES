import Link from "next/link";

type PricingLine = {
  id: string;
  service: string;
  price: string;
};

type PricingStage = {
  id: string;
  number: string;
  title: string;
  blurb: string;
  lines: readonly PricingLine[];
};

/** USD ranges converted from RUB enterprise quotes (~80 ₽ / $1). */
const STAGES: readonly PricingStage[] = [
  {
    id: "discover",
    number: "01",
    title: "Discover",
    blurb: "Clarify the opportunity before you commit capital.",
    lines: [
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
    ],
  },
  {
    id: "prove",
    number: "02",
    title: "Prove",
    blurb: "Validate one scenario, then one business unit.",
    lines: [
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
    ],
  },
  {
    id: "scale",
    number: "03",
    title: "Scale",
    blurb: "Deploy, harden the perimeter, and license the platform.",
    lines: [
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
    ],
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
        <h2 className="mt-4 max-w-xl font-(family-name:--font-landing-serif) text-3xl leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
          Engagements sized for enterprise outcomes.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">
          Indicative USD ranges for NULLXES professional services and platform
          licensing. Final scope is scoped per organization.
        </p>

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {STAGES.map((stage) => (
            <article
              key={stage.id}
              className="group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-[border-color,background-color] duration-300 hover:border-(--landing-gold)/35 hover:bg-white/[0.045]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
              />

              <header className="border-b border-white/8 px-5 py-5 sm:px-6">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] tracking-[0.22em] text-(--landing-gold)">
                    {stage.number}
                  </span>
                  <h3 className="font-(family-name:--font-landing-serif) text-2xl tracking-tight text-white">
                    {stage.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/40">
                  {stage.blurb}
                </p>
              </header>

              <ul className="flex flex-1 flex-col px-5 py-2 sm:px-6">
                {stage.lines.map((line) => (
                  <li
                    key={line.id}
                    className="border-b border-white/8 py-4 last:border-b-0"
                  >
                    <p className="text-[13px] leading-snug tracking-tight text-white/80">
                      {line.service}
                    </p>
                    <p className="mt-2 font-mono text-[13px] tabular-nums text-(--landing-gold)">
                      {line.price}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
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

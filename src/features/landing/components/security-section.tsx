const CARDS = [
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

export function SecuritySection() {
  return (
    <section
      id="security"
      className="relative flex min-h-dvh flex-col justify-center border-t border-white/10 px-6 py-16 md:px-10 lg:px-14 lg:py-0"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
          Security
        </p>
        <h2 className="mt-4 max-w-xl font-(family-name:--font-landing-serif) text-3xl leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
          Trust is the product surface.
        </h2>

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {CARDS.map((card) => (
            <article
              key={card.id}
              className="group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-[border-color,background-color] duration-300 hover:border-(--landing-gold)/35 hover:bg-white/[0.045]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
              />

              <div className="flex flex-1 flex-col px-5 py-6 sm:px-6 sm:py-7">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] tracking-[0.22em] text-(--landing-gold)">
                    {card.number}
                  </span>
                  <h3 className="font-(family-name:--font-landing-serif) text-2xl tracking-tight text-white">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-white/45">
                  {card.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

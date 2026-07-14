const CARDS = [
  {
    id: "identity-access",
    number: "01",
    title: "Identity & access",
    body: "Role-based permissions, secure authentication, and controlled workspace access for every team.",
  },
  {
    id: "infrastructure-control",
    number: "02",
    title: "Infrastructure control",
    body: "Manage API keys, IP allowlists, webhooks, and external integrations from a single control layer.",
  },
  {
    id: "session-governance",
    number: "03",
    title: "Session governance",
    body: "Control session limits, usage budgets, and maintain a complete audit trail for every digital employee.",
  },
] as const;

export function SecuritySection() {
  return (
    <section
      id="security"
      className="relative flex min-h-svh flex-col justify-center border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24 md:px-10 lg:min-h-dvh lg:px-14 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
          Security
        </p>
        <h2 className="mt-5 max-w-xl font-(family-name:--font-landing-serif) text-[1.85rem] leading-[1.12] tracking-tight text-white sm:mt-6 sm:text-4xl lg:text-[2.75rem]">
          Control every digital employee.
        </h2>

        <div className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {CARDS.map((card) => (
            <article
              key={card.id}
              className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/8 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:min-h-72 sm:px-7 sm:py-8"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
              />

              <div className="flex flex-1 flex-col">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] tracking-[0.22em] text-(--landing-gold)">
                    {card.number}
                  </span>
                  <h3 className="font-(family-name:--font-landing-serif) text-xl tracking-tight text-white sm:text-2xl">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-6 text-sm leading-relaxed text-white/50 sm:mt-7 sm:text-[15px]">
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

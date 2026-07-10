import Link from "next/link";

const STEPS = [
  {
    title: "Deploy Adeline",
    body: "Stand up a Digital Executive with voice, reasoning, and enterprise posture.",
  },
  {
    title: "Connect the business",
    body: "Attach channels, knowledge, and operating context so she works inside your stack.",
  },
  {
    title: "Supervise from HQ",
    body: "Watch status, missions, and outcomes — intervene only when the floor needs you.",
  },
] as const;

export function UseCaseSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section
      id="use-case"
      className="relative border-t border-white/10 px-6 py-20 md:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] tracking-[0.28em] text-(--landing-gold) uppercase">
          Use case
        </p>
        <h2 className="mt-4 max-w-2xl font-(family-name:--font-landing-serif) text-3xl tracking-tight text-white sm:text-4xl">
          An executive that speaks and operates — not a chatbot widget.
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55">
          Adeline Kalen is a Digital Executive on the NULLXES floor. She handles
          high-stakes conversations, drafts decisions, and stays visible as a
          member of your workforce.
        </p>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-white/8 bg-white/2 p-6"
            >
              <p className="text-[11px] tracking-[0.2em] text-(--landing-gold)/80">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-sm font-medium text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12" id="security">
          <Link
            href={signedIn ? "/dashboard" : "/register"}
            className="inline-flex text-sm text-(--landing-gold) transition-opacity hover:opacity-80"
          >
            {signedIn
              ? "Go to dashboard →"
              : "Register to deploy your workforce →"}
          </Link>
        </div>
      </div>
    </section>
  );
}

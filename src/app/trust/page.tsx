import Link from "next/link";

const TRUST_SECTIONS = [
  {
    title: "Data residency",
    body: "Organization data is stored in Neon PostgreSQL with configurable regional placement. Enterprise deployments can target global or Russia (RU) data regions.",
  },
  {
    title: "Encryption",
    body: "Sensitive fields — outbound webhook secrets, integration tokens, and export download tokens — are encrypted at rest using AES-256-GCM field-level encryption.",
  },
  {
    title: "Access control",
    body: "Role-based workspace permissions, optional two-factor authentication for administrators, API key authentication, and IP allowlists for programmatic access.",
  },
  {
    title: "Audit & retention",
    body: "Security-relevant actions are recorded in an immutable audit log. Session data is purged automatically according to your organization's retention policy.",
  },
  {
    title: "Transparency",
    body: "Workspace owners can export organization data, review audit events, and request asynchronous export jobs for compliance workflows.",
  },
] as const;

export default function TrustPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
          NULLXES Digital Employees
        </p>
        <h1 className="mt-4 text-3xl font-medium tracking-tight">Trust Center</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Security, privacy, and operational transparency for enterprise digital
          workforce deployments.
        </p>

        <div className="mt-12 grid gap-6">
          {TRUST_SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-white/10 bg-[#111111] p-6"
            >
              <h2 className="text-sm font-medium text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-white/50">
          Documentation for software registry review:{" "}
          <Link href="/docs" className="text-white hover:underline">
            /docs
          </Link>
          . Questions?{" "}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>{" "}
          to review your organization security settings.
        </p>
      </div>
    </main>
  );
}

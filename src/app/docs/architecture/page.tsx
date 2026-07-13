import Link from "next/link";

export default function DocsArchitecturePage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Архитектура платформы
        </h2>
        <p className="mt-4">
          NULLXES Digital Employees — операционная система цифровой рабочей силы.
          Схема без маркетинга.
        </p>
      </header>

      <section
        id="flow"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Поток данных</h3>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/8 bg-black/50 p-4 font-mono text-[12px] leading-6 text-white/75">
{`Пользователь
    ↓
Workspace / Organization
    ↓
Цифровые сотрудники
    ↓
Knowledge
    ↓
Talk Runtime
    ↓
LLM Provider
    ↓
Logs / Audit`}
        </pre>
      </section>

      <section
        id="stack"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Слои</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <span className="text-white">Identity</span> — Better Auth, membership,
            RBAC
          </li>
          <li>
            <span className="text-white">Workforce</span> — digital employees,
            catalog, missions
          </li>
          <li>
            <span className="text-white">Runtime</span> — Talk (brain-stream),
            avatar session
          </li>
          <li>
            <span className="text-white">Integrations</span> — Public API, API
            keys, outbound webhooks
          </li>
          <li>
            <span className="text-white">Governance</span> — billing limits, audit,
            org isolation
          </li>
        </ul>
        <p className="mt-4">
          См. также{" "}
          <Link href="/docs/organizations" className="text-white underline">
            организации
          </Link>
          ,{" "}
          <Link href="/docs/security" className="text-white underline">
            безопасность
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

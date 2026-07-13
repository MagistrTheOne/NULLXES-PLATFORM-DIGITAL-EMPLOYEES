import Link from "next/link";

export default function DocsOrganizationsPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Организации
        </h2>
        <p className="mt-4">
          Tenant boundary платформы. Данные и лимиты считаются на организацию.
        </p>
      </header>

      <section
        id="model"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Модель</h3>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/8 bg-black/50 p-4 font-mono text-[12px] leading-6 text-white/75">
{`Organization
├ Owner (membership)
├ Members (admin / operator / viewer)
├ Digital employees
├ Knowledge / Missions / Sessions
├ API keys
└ Billing plan + limits`}
        </pre>
      </section>

      <section
        id="isolation"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Изоляция</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Запросы UI и API scoped по organizationId</li>
          <li>RLS (defense-in-depth) на org-таблицах</li>
          <li>Каталог NULLXES — read для Talk, definition immutable</li>
        </ul>
        <p className="mt-4">
          См.{" "}
          <Link href="/docs/access-control" className="text-white underline">
            управление доступом
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

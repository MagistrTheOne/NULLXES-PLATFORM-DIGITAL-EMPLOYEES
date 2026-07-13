import Link from "next/link";

export default function DocsApiKeysPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          API Keys
        </h2>
        <p className="mt-4">
          Ключи организации для Public API. Префикс{" "}
          <span className="font-mono text-white/80">nx_live_</span>. Полное
          значение показывается один раз при создании.
        </p>
      </header>

      <section
        id="create"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Создание</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Settings → Security → API keys</li>
          <li>Только Owner</li>
          <li>Доступ зависит от тарифа (none / read / full)</li>
        </ul>
      </section>

      <section
        id="scopes"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Scopes</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5 font-mono text-xs text-white/75">
          <li>employees:read / employees:write</li>
          <li>sessions:read</li>
          <li>tasks:write</li>
        </ul>
        <p className="mt-4">
          Bundles: Read-only · Workforce Operator · Admin Integration. См.{" "}
          <Link href="/docs/api#auth" className="text-white underline">
            /docs/api
          </Link>
          .
        </p>
      </section>

      <section
        id="revoke"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Отзыв и rotation</h3>
        <p className="mt-3">
          Отзыв — немедленная инвалидация. Rotation: создать новый ключ →
          переключить интеграции → отозвать старый. Храните секреты вне
          репозитория.
        </p>
      </section>
    </article>
  );
}

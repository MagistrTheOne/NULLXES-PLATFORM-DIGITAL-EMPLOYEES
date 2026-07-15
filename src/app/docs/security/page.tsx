import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/security");

export default function DocsSecurityPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Безопасность платформы
        </h2>
        <p className="mt-4">Контроли без воды. То, что реально есть в продукте.</p>
      </header>

      <section
        id="transport"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Транспорт и сессии</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>TLS на edge / hosting</li>
          <li>Better Auth session cookies</li>
          <li>CSP и security headers приложения</li>
        </ul>
      </section>

      <section
        id="access"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Доступ</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>RBAC: owner / admin / operator / viewer</li>
          <li>Organization isolation (+ RLS defense-in-depth)</li>
          <li>2FA — в настройках безопасности аккаунта (если включено)</li>
        </ul>
      </section>

      <section
        id="controls"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Контроли</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <Link href="/docs/api-keys" className="text-white underline">
              API Keys
            </Link>{" "}
            + scopes
          </li>
          <li>
            Подписанные{" "}
            <Link href="/docs/webhooks" className="text-white underline">
              Webhooks
            </Link>
          </li>
          <li>
            <Link href="/docs/audit" className="text-white underline">
              Audit
            </Link>
          </li>
          <li>Catalog employees — immutable definition</li>
        </ul>
      </section>
    </article>
  );}

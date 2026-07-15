import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/audit");

export default function DocsAuditPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Аудит действий
        </h2>
        <p className="mt-4">
          Запись значимых действий в организации: ключи, участники, экспорт,
          настройки.
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Обзор</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Таблица audit_event, scoped по organizationId</li>
          <li>Примеры: api_key.created / revoked, member.*, data.exported</li>
          <li>
            Связано с{" "}
            <Link href="/docs/security" className="text-white underline">
              безопасностью
            </Link>{" "}
            и{" "}
            <Link href="/docs/personal-data" className="text-white underline">
              ПДн
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );}

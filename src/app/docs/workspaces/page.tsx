import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/workspaces");

export default function DocsWorkspacesPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Рабочие пространства
        </h2>
        <p className="mt-4">
          Workspace — контекст сессии пользователя: активная организация,
          права, биллинг.
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Обзор</h3>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/8 bg-black/50 p-4 font-mono text-[12px] leading-6 text-white/75">
{`User
  ↓ membership
Organization
  ↓ workspace context
Dashboard / Talk / API`}
        </pre>
        <p className="mt-4">
          Один пользователь может состоять в нескольких организациях. Активный
          workspace выбирается при входе. Подробнее:{" "}
          <Link href="/docs/organizations" className="text-white underline">
            организации
          </Link>
          ,{" "}
          <Link href="/docs/roles" className="text-white underline">
            роли
          </Link>
          .
        </p>
      </section>
    </article>
  );}

import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/access-control");

export default function DocsAccessControlPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Управление доступом
        </h2>
        <p className="mt-4">Owner · Roles · Permissions · Organization isolation.</p>
      </header>

      <section
        id="rbac"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">RBAC</h3>
        <p className="mt-3">
          Права вычисляются из membership role. Матрица:{" "}
          <Link href="/docs/roles" className="text-white underline">
            /docs/roles
          </Link>
          .
        </p>
      </section>

      <section
        id="isolation"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Изоляция org</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Все бизнес-сущности привязаны к organizationId</li>
          <li>Public API ключ всегда принадлежит одной org</li>
          <li>Кросс-tenant доступ запрещён</li>
        </ul>
      </section>
    </article>
  );}

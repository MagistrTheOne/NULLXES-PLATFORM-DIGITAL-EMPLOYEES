import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/integrations");

export default function DocsIntegrationsPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Интеграции
        </h2>
        <p className="mt-4">Точки расширения платформы для внешних систем.</p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Обзор</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <Link href="/docs/api" className="text-white underline">
              Public API
            </Link>{" "}
            — CRUD workforce, tasks, sessions
          </li>
          <li>
            <Link href="/docs/webhooks" className="text-white underline">
              Webhooks
            </Link>{" "}
            — push событий
          </li>
          <li>
            Avatar / voice providers — provisioning через платформу (не
            клиентские lab keys)
          </li>
          <li>Billing webhooks (Polar / T-Bank) — внутренние платформенные</li>
        </ul>
      </section>
    </article>
  );}

import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/changelog");

export default function DocsChangelogPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Changelog документации
        </h2>
        <p className="mt-4">
          Изменения портала /docs и Public API. Версия портала: 2.1.0.
        </p>
      </header>

      <section
        id="recent"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">13 июля 2026 — 2.1.0</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            IA developer portal: Начало · Workforce · Платформа · Админ ·
            Безопасность · Правовые · Developers · Enterprise
          </li>
          <li>
            Новые страницы: architecture, organizations, roles, API keys,
            webhooks, limits, security, enterprise
          </li>
          <li>Помощник: Yuki Nakora (без брендинга модели в UI)</li>
        </ul>

        <h3 className="mt-8 font-medium text-white">10 июля 2026 — 2.0.0</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Первый portal /docs + Public API human docs</li>
          <li>
            Agent-readable:{" "}
            <span className="font-mono text-white">/llms.txt</span>
          </li>
        </ul>
      </section>
    </article>
  );
}

export default function DocsChangelogPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Changelog документации
        </h2>
        <p className="mt-4">
          Изменения портала /docs и Public API. Версия портала: 2.0.0.
        </p>
      </header>

      <section
        id="recent"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">10 июля 2026 — 2.0.0</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Diátaxis IA: Начало / Руководства / Справочник / Соответствие</li>
          <li>
            Новые разделы: Тарифы, Talk, Knowledge, Troubleshooting, Changelog
          </li>
          <li>
            Ассистент Yuki Nakora: OpenAI GPT-4o + RAG по корпусу /docs +
            citations + multi-turn
          </li>
          <li>
            Agent-readable:{" "}
            <span className="font-mono text-white">/llms.txt</span>,{" "}
            <span className="font-mono text-white">/llms-full.txt</span>
          </li>
          <li>Public API human docs + Orval typed client</li>
        </ul>
      </section>
    </article>
  );
}

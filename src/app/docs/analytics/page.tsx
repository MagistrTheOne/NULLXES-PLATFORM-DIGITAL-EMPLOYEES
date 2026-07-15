import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/analytics");

export default function DocsAnalyticsPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Аналитика
        </h2>
        <p className="mt-4">
          Вторичный слой относительно workforce. Дашборд показывает активность
          сотрудников, сессии и использование лимитов.
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Обзор</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>UI: Analytics в dashboard</li>
          <li>Метрики scoped по организации</li>
          <li>Не заменяет audit log — см. Аудит действий</li>
        </ul>
      </section>
    </article>
  );
}

import Link from "next/link";

export default function DocsDataStoragePage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Хранение данных
        </h2>
        <p className="mt-4">Для Enterprise и 152-ФЗ path — где и как живут данные.</p>
      </header>

      <section
        id="where"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Где хранятся</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>PostgreSQL (Neon) — первичный контур Global</li>
          <li>Object storage — аватары / файлы knowledge (по конфигурации)</li>
          <li>dataRegion на org — продуктовый флаг; RU contour — отдельный деплой</li>
        </ul>
        <p className="mt-3 text-white/45">
          Не заявляем residency в РФ, пока не подключён отдельный RU DB contour.
        </p>
      </section>

      <section
        id="retention"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Удаление и экспорт</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Экспорт данных организации — Settings / security flows</li>
          <li>Удаление / purge — по запросу и политикам retention</li>
          <li>
            ПДн:{" "}
            <Link href="/docs/personal-data" className="text-white underline">
              /docs/personal-data
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}

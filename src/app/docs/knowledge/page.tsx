import Link from "next/link";

export default function DocsKnowledgePage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Knowledge
        </h2>
        <p className="mt-4">
          База знаний digital employee: источники индексируются и используются в
          Talk (RAG).
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">1. Обзор</h3>
        <p className="mt-3">
          Knowledge sources привязаны к сотруднику. Индексация выполняется
          фоновыми задачами Inngest. В диалоге retrieval подмешивает релевантные
          фрагменты в контекст brain-stream.
        </p>
      </section>

      <section
        id="upload"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">2. Загрузка</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Откройте сотрудника → Knowledge / Studio</li>
          <li>Добавьте URL или файл</li>
          <li>Дождитесь статуса indexing → ready</li>
        </ol>
      </section>

      <section
        id="limits"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">3. Лимиты chunks</h3>
        <p className="mt-3">
          Максимум knowledge chunks задаётся тарифом. Матрица:{" "}
          <Link href="/docs/plans" className="text-white underline">
            /docs/plans
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

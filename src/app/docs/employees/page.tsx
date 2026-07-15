import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/employees");

export default function DocsEmployeesPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Цифровые сотрудники
        </h2>
        <p className="mt-4">
          Основная сущность платформы. Всё остальное — сервисы вокруг workforce.
        </p>
      </header>

      <section
        id="model"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Модель</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Принадлежит организации (tenant boundary)</li>
          <li>Character / Skills / Tools — blueprint</li>
          <li>Knowledge — корпоративный контекст</li>
          <li>Talk — runtime-сессия с пользователем</li>
          <li>Missions — фоновые и плановые задания</li>
        </ul>
      </section>

      <section
        id="catalog"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Каталог NULLXES</h3>
        <p className="mt-3">
          Опубликованные сотрудники платформы (например Adeline, Yuki) доступны
          для Talk. Их определение immutable: изменение definition через Public
          API и UI запрещено. Кастомные сотрудники создаются в рамках лимита
          тарифа.
        </p>
      </section>

      <section
        id="lifecycle"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Жизненный цикл</h3>
        <p className="mt-3 font-mono text-xs text-white/70">
          draft → active → paused → archived
        </p>
        <p className="mt-3">
          Talk:{" "}
          <Link href="/docs/talk" className="text-white underline">
            /docs/talk
          </Link>
          . Лимиты:{" "}
          <Link href="/docs/limits" className="text-white underline">
            /docs/limits
          </Link>
          .
        </p>
      </section>
    </article>
  );}

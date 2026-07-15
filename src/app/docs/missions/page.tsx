import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/missions");

export default function DocsMissionsPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Миссии
        </h2>
        <p className="mt-4">
          Плановые и ручные задания для digital employee вне живого Talk.
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Обзор</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Привязка к сотруднику и организации</li>
          <li>Skill IDs / schedule — по конфигурации миссии</li>
          <li>UI: Mission Control в dashboard</li>
        </ul>
      </section>

      <section
        id="runtime"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Запуск</h3>
        <p className="mt-3">
          Выполнение идёт через фоновые воркеры платформы. Результаты и статусы
          доступны в UI миссий. Для автоматизации извне —{" "}
          <Link href="/docs/api" className="text-white underline">
            Public API tasks
          </Link>
          .
        </p>
      </section>
    </article>
  );}

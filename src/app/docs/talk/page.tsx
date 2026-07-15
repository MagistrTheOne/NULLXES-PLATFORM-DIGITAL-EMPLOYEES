import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/talk");

export default function DocsTalkPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">Talk</h2>
        <p className="mt-4">
          Премиальный диалог с digital employee: текст и голос. Когниция
          принадлежит платформе; аватар Anam — визуальный слой.
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">1. Обзор</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Brain:{" "}
            <span className="font-mono text-white">POST /api/talk/brain-stream</span>
          </li>
          <li>Anam — avatar-only (без встроенного LLM persona)</li>
          <li>
            История:{" "}
            <Link href="/dashboard/conversations" className="text-white underline">
              /dashboard/conversations
            </Link>
          </li>
        </ul>
      </section>

      <section
        id="start"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">2. Как начать</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Откройте карточку сотрудника</li>
          <li>Убедитесь, что статус Talk Ready</li>
          <li>Нажмите Talk и начните сессию</li>
          <li>Завершите сессию кнопкой End session</li>
        </ol>
      </section>

      <section
        id="limits"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">3. Лимиты</h3>
        <p className="mt-3">
          Длительность сессии и месячный бюджет минут зависят от тарифа. См.{" "}
          <Link href="/docs/plans" className="text-white underline">
            /docs/plans
          </Link>
          .
        </p>
      </section>

      <section
        id="ready"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">4. Talk Ready</h3>
        <p className="mt-3">
          Готовность = avatar provisioning ready + session provisioning ready.
          Если Talk недоступен — см.{" "}
          <Link href="/docs/troubleshooting#talk" className="text-white underline">
            устранение неполадок
          </Link>
          .
        </p>
      </section>
    </article>
  );}

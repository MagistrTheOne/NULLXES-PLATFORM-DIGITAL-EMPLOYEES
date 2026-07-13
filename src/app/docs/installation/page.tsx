import {
  DOCS_LEGAL_ENTITY,
  DOCS_SOURCE_ACCESS_POLICY,
} from "../_lib/docs-legal";

export default function DocsInstallationPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Быстрый старт
        </h2>
        <p className="mt-4">
          Программное обеспечение развёртывается как веб-приложение (SaaS).
          Установка на стороне конечного пользователя не требуется — достаточно
          современного браузера. Ниже — требования и порядок развёртывания для
          администратора инфраструктуры.
        </p>
      </header>

      <section
        id="requirements"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Требования</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Node.js 20+ (сборка и локальная разработка)</li>
          <li>PostgreSQL 15+ (рекомендуется Neon serverless)</li>
          <li>Хостинг с поддержкой Next.js (Vercel или аналог)</li>
          <li>Доступ к Inngest Cloud для фоновых задач</li>
          <li>Ключ OpenAI API для LLM-функций</li>
        </ul>
      </section>

      <section
        id="source"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Исходный код</h3>
        <p className="mt-3">{DOCS_SOURCE_ACCESS_POLICY}</p>
        <p className="mt-3">
          Запрос:{" "}
          <a
            href={`mailto:${DOCS_LEGAL_ENTITY.email}`}
            className="text-white underline"
          >
            {DOCS_LEGAL_ENTITY.email}
          </a>
          {" · "}
          <a
            href="https://t.me/MagistrTheOne"
            className="text-white underline"
            target="_blank"
            rel="noreferrer"
          >
            {DOCS_LEGAL_ENTITY.telegram}
          </a>
        </p>
      </section>

      <section
        id="env"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Окружение</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-4">Переменная</th>
                <th className="py-2">Назначение</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">DATABASE_URL</td>
                <td className="py-2 text-white/60">PostgreSQL connection string</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">BETTER_AUTH_SECRET</td>
                <td className="py-2 text-white/60">Секрет сессий</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">BETTER_AUTH_URL</td>
                <td className="py-2 text-white/60">https://www.nullxesdai.online</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">NEXT_PUBLIC_BETTER_AUTH_URL</td>
                <td className="py-2 text-white/60">Публичный URL auth</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">DATA_ENCRYPTION_KEY</td>
                <td className="py-2 text-white/60">AES-256-GCM, base64</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">OPENAI_API_KEY</td>
                <td className="py-2 text-white/60">OpenAI GPT API</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">INNGEST_EVENT_KEY</td>
                <td className="py-2 text-white/60">Отправка событий Inngest</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">INNGEST_SIGNING_KEY</td>
                <td className="py-2 text-white/60">Верификация Inngest webhook</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-white">RESEND_API_KEY</td>
                <td className="py-2 text-white/60">Email (auth, outbound)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          Полный перечень переменных передаётся вместе с доступом к исходникам
          (по запросу).
        </p>
      </section>

      <section
        id="verify"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Проверка</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>
            <span className="font-mono text-white">GET /api/health/db</span> →{" "}
            <span className="text-white">{`{"ok":true}`}</span>
          </li>
          <li>Вход на /login, создание организации</li>
          <li>Создание цифрового сотрудника</li>
          <li>Тестовая миссия (Mission Control)</li>
        </ol>
      </section>
    </article>
  );
}

export default function DocsInstallationPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Информация для установки
        </h2>
        <p className="mt-4">
          Программное обеспечение развёртывается как веб-приложение (SaaS).
          Установка на стороне конечного пользователя не требуется — достаточно
          современного браузера. Ниже — требования и порядок развёртывания для
          администратора инфраструктуры.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
        <h3 className="font-medium text-white">1. Системные требования</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Node.js 20+ (сборка и локальная разработка)</li>
          <li>PostgreSQL 15+ (рекомендуется Neon serverless)</li>
          <li>Хостинг с поддержкой Next.js (Vercel или аналог)</li>
          <li>Доступ к Inngest Cloud для фоновых задач</li>
          <li>Ключ OpenAI API для LLM-функций</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
        <h3 className="font-medium text-white">2. Получение исходного кода</h3>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black p-4 font-mono text-xs text-white/80">
{`git clone <repository-url>
cd dplatform
npm install`}
        </pre>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
        <h3 className="font-medium text-white">
          3. Переменные окружения (обязательные для production)
        </h3>
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
          Полный перечень — в репозитории:{" "}
          <span className="font-mono text-white">docs/DEPLOYMENT_RF.md</span>
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
        <h3 className="font-medium text-white">4. Миграции базы данных</h3>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black p-4 font-mono text-xs text-white/80">
{`npm run db:migrate
npm run db:verify`}
        </pre>
        <p className="mt-4">
          На Vercel миграции могут выполняться автоматически на этапе build
          (auto-migrate on build).
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
        <h3 className="font-medium text-white">5. Регистрация Inngest</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>
            В Inngest Dashboard → Apps → Sync URL:{" "}
            <span className="font-mono text-white">
              https://www.nullxesdai.online/api/inngest
            </span>
          </li>
          <li>Указать INNGEST_SIGNING_KEY и INNGEST_EVENT_KEY в Vercel</li>
          <li>Redeploy и проверить: 16 functions found</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
        <h3 className="font-medium text-white">6. Проверка после установки</h3>
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

import Link from "next/link";

export default function DocsOperationPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Информация для эксплуатации
        </h2>
        <p className="mt-4">
          Руководство пользователя и администратора по эксплуатации NULLXES
          Digital Employees в production-среде{" "}
          <span className="font-mono text-white">nullxesdai.online</span>.
        </p>
      </header>

      <section
        id="login"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">1. Вход в систему</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>
            Откройте{" "}
            <span className="font-mono text-white">/login</span>
          </li>
          <li>Введите email и пароль или зарегистрируйтесь на /register</li>
          <li>
            При включённой 2FA подтвердите код (Settings → Security)
          </li>
          <li>После входа откроется Dashboard — /dashboard</li>
        </ol>
      </section>

      <section
        id="create"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">
          2. Создание цифрового сотрудника
        </h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Sidebar → Digital Employees → New Digital Employee</li>
          <li>Укажите имя, роль, department, system prompt</li>
          <li>
            В Studio настройте Brain provider (рекомендуется OpenAI GPT для
            production), модель, avatar, voice
          </li>
          <li>Загрузите knowledge sources при необходимости</li>
          <li>Дождитесь статуса provisioning → Ready</li>
        </ol>
      </section>

      <section
        id="talk"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">3. Диалог с сотрудником (Talk)</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Откройте карточку сотрудника → Talk</li>
          <li>Начните текстовую или голосовую сессию</li>
          <li>
            Ответы формируются с учётом system prompt и базы знаний (RAG)
          </li>
          <li>История — Conversations (/dashboard/conversations)</li>
        </ol>
      </section>

      <section
        id="missions"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">4. Mission Control — постановка миссии</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Sidebar → Missions → Assign mission (/dashboard/missions/new)</li>
          <li>Выберите сотрудника (например, Yuki Nakora)</li>
          <li>Тип: Prospecting или Custom</li>
          <li>
            Brief — текстовое задание, например: «Find 10 B2B companies in
            Europe that could benefit from NULLXES Digital Employees…»
          </li>
          <li>Нажмите Assign mission</li>
          <li>
            На странице миссии отслеживайте Timeline: research → leads →
            approval → outbound → handoff
          </li>
          <li>
            Settings → Security → Approvals — согласуйте proposals перед
            исходящей отправкой
          </li>
        </ol>
        <p className="mt-4">
          Обработка миссии выполняется фоново через Inngest. Страницу миссии
          обновляйте вручную (F5) для актуального статуса.
        </p>
      </section>

      <section
        id="settings"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">5. Настройки организации</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Settings → General</strong> — язык,
            timezone, retention (
            <Link href="/dashboard/settings" className="text-white underline">
              /dashboard/settings
            </Link>
            )
          </li>
          <li>
            <strong className="text-white">Settings → Team</strong> — участники,
            приглашения, роли
          </li>
          <li>
            <strong className="text-white">Settings → AI</strong> — brain
            provider по умолчанию, модель, собственные API keys (OpenAI)
          </li>
          <li>
            <strong className="text-white">Settings → Security</strong> — 2FA,
            API keys, IP allowlist, approvals
          </li>
          <li>
            <strong className="text-white">Settings → Advanced</strong> — экспорт
            данных организации
          </li>
        </ul>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">6. Public API</h3>
        <p className="mt-3">
          REST API v1 — сотрудники, сессии Talk и задачи. Ключи: Settings →
          Security. Полное описание scopes, эндпоинтов и примеров — в разделе{" "}
          <a href="/docs/api" className="text-white underline">
            /docs/api
          </a>
          . Машинная спецификация OpenAPI:{" "}
          <a href="/api/docs" className="font-mono text-white underline">
            GET /api/docs
          </a>
          .
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Base path:{" "}
            <span className="font-mono text-white">/api/v1</span>
          </li>
          <li>
            Auth:{" "}
            <span className="font-mono text-white">
              Authorization: Bearer nx_live_…
            </span>
          </li>
          <li>
            Тариф: Evaluation/Studio — без API; Team — чтение; Scale+ —
            полный доступ
          </li>
        </ul>
      </section>

      <section
        id="monitoring"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">7. Мониторинг и поддержка</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Inngest Dashboard — Runs, Events, cron-задачи</li>
          <li>Settings → Audit — журнал действий</li>
          <li>Analytics — метрики использования</li>
          <li>
            Trust Center —{" "}
            <span className="font-mono text-white">/trust</span> (безопасность,
            шифрование, retention)
          </li>
        </ul>
      </section>
    </article>
  );
}

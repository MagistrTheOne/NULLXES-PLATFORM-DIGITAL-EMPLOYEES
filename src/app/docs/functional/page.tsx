export default function DocsFunctionalPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Описание функциональных характеристик
        </h2>
        <p className="mt-4">
          Программное обеспечение{" "}
          <strong className="font-medium text-white">
            NULLXES Digital Employees
          </strong>{" "}
          предназначено для создания, настройки, развёртывания и эксплуатации
          цифровых сотрудников (Digital Employees) в корпоративной среде.
        </p>
      </header>

      <section
        id="purpose"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">1. Назначение</h3>
        <p className="mt-3">
          Платформа обеспечивает единую операционную среду для управления
          цифровой рабочей силой: постановка задач, проведение диалогов,
          контроль выполнения, аналитика и интеграция с внешними системами
          через API.
        </p>
      </section>

      <section
        id="modules"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">2. Состав функциональных модулей</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Аутентификация и рабочее пространство</strong>{" "}
            — регистрация, вход, управление организацией, ролями и приглашениями
            участников.
          </li>
          <li>
            <strong className="text-white">Цифровые сотрудники</strong> — создание
            профиля, настройка роли, системного промпта, аватара (Anam), голоса
            (ElevenLabs), мозга (Brain provider).
          </li>
          <li>
            <strong className="text-white">Talk / Conversations</strong> — текстовые
            и голосовые сессии с цифровым сотрудником, история диалогов, лимиты
            сессий по тарифу.
          </li>
          <li>
            <strong className="text-white">Knowledge</strong> — загрузка и
            индексация базы знаний сотрудника, семантический поиск (RAG) при
            ответах.
          </li>
          <li>
            <strong className="text-white">Mission Control</strong> — постановка
            миссий (prospecting/custom), веб-исследование, генерация лидов и
            коммерческих предложений, очередь согласования, исходящая отправка
            писем, workforce handoff между сотрудниками.
          </li>
          <li>
            <strong className="text-white">NULLXES HQ</strong> — операционный
            центр задач и активности цифровой рабочей силы.
          </li>
          <li>
            <strong className="text-white">Analytics</strong> — метрики сессий,
            сообщений, знаний и активности сотрудников.
          </li>
          <li>
            <strong className="text-white">Settings</strong> — профиль
            организации, команда, биллинг, безопасность (2FA, API keys, IP
            allowlist), AI-провайдеры, уведомления, экспорт данных.
          </li>
          <li>
            <strong className="text-white">Public API v1</strong> — REST API для
            управления сотрудниками, сессиями и задачами; OpenAPI на{" "}
            <span className="font-mono text-white">/api/docs</span>.
          </li>
          <li>
            <strong className="text-white">Фоновые процессы (Inngest)</strong>{" "}
            — ingestion знаний, суммаризация сессий, retention, уведомления,
            обработка миссий и cron-расписаний.
          </li>
        </ul>
      </section>

      <section
        id="nlp"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">3. Обработка естественного языка</h3>
        <p className="mt-3">
          Для генерации и анализа текстов (диалоги, миссии, структурирование
          данных из веб-поиска) применяется{" "}
          <strong className="text-white">OpenAI GPT</strong> через официальный
          API. Организация может использовать платформенный ключ или собственный
          ключ OpenAI (Settings → AI → Provider API keys). Для модуля Mission
          Control парсинг и структурирование результатов выполняется только
          через GPT-модели OpenAI.
        </p>
      </section>

      <section
        id="stack"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">4. Технологический стек</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Next.js 16 (App Router), React 19, TypeScript</li>
          <li>PostgreSQL (Neon), Drizzle ORM</li>
          <li>Better Auth — аутентификация</li>
          <li>Inngest — очереди и cron</li>
          <li>Resend — транзакционная и исходящая почта</li>
          <li>shadcn/ui, Tailwind CSS v4 — интерфейс</li>
        </ul>
      </section>

      <section
        id="roles"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">5. Роли пользователей</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Owner / Administrator</strong> —
            полное управление организацией, настройками, ключами, согласованиями.
          </li>
          <li>
            <strong className="text-white">Member</strong> — работа с
            сотрудниками, миссиями и диалогами в рамках выданных прав.
          </li>
        </ul>
      </section>
    </article>
  );
}

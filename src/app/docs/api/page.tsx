import Link from "next/link";

export default function DocsApiPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Public API v1
        </h2>
        <p className="mt-4">
          REST API для внешних интеграций: сотрудники, сессии Talk и постановка
          задач. Контракт — OpenAPI; ключи создаются в Settings → Security.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-[13px]">
          <Link
            href="/api/docs"
            className="rounded-md border border-white/10 bg-[#111111] px-3 py-1.5 font-mono text-white transition-colors hover:border-white/20"
          >
            GET /api/docs
          </Link>
          <Link
            href="/docs/operation#api"
            className="rounded-md border border-white/10 px-3 py-1.5 text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            Эксплуатация → API
          </Link>
        </div>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">1. Обзор</h3>
        <dl className="mt-4 grid gap-3">
          <div>
            <dt className="text-white/40">Base URL</dt>
            <dd className="mt-1 font-mono text-white">/api/v1</dd>
          </div>
          <div>
            <dt className="text-white/40">Production</dt>
            <dd className="mt-1 font-mono text-white">
              https://www.nullxesdai.online/api/v1
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Аутентификация</dt>
            <dd className="mt-1 font-mono text-white">
              Authorization: Bearer nx_live_…
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Спецификация</dt>
            <dd className="mt-1">
              <Link href="/api/docs" className="font-mono text-white underline">
                /api/docs
              </Link>{" "}
              (OpenAPI YAML)
            </dd>
          </div>
        </dl>
        <p className="mt-4">
          Публичная поверхность — только{" "}
          <span className="font-mono text-white">/api/v1/*</span>. Внутренние
          маршруты Talk, Anam, Inngest, биллинга и auth в Public API не входят.
        </p>
      </section>

      <section
        id="auth"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">2. Ключи и scopes</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Откройте Settings → Security</li>
          <li>Создайте API key (нужны права владельца организации)</li>
          <li>
            Выберите bundle: Read-only, Workforce Operator или Admin Integration
          </li>
          <li>
            Передайте ключ только в заголовке{" "}
            <span className="font-mono text-white">Authorization</span>
          </li>
        </ol>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-md text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-4 font-medium">Scope</th>
                <th className="py-2 font-medium">Доступ</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-white">employees:read</td>
                <td className="py-2">Список и карточка сотрудника</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-white">employees:write</td>
                <td className="py-2">Создание, изменение, удаление</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-white">sessions:read</td>
                <td className="py-2">Сессии Talk</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-white">tasks:write</td>
                <td className="py-2">Задачи сотруднику и workforce assign</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          Доступ к API зависит от тарифа: Evaluation / Starter / Studio — без
          ключей; Team — чтение; Scale / Enterprise / Holding — полный доступ.
        </p>
      </section>

      <section
        id="endpoints"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">3. Эндпоинты</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-lg text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-3 font-medium">Method</th>
                <th className="py-2 pr-3 font-medium">Path</th>
                <th className="py-2 font-medium">Scope</th>
              </tr>
            </thead>
            <tbody className="font-mono text-white/70">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">GET</td>
                <td className="py-2 pr-3">/employees</td>
                <td className="py-2">employees:read</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">POST</td>
                <td className="py-2 pr-3">/employees</td>
                <td className="py-2">employees:write</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">GET</td>
                <td className="py-2 pr-3">/employees/{"{id}"}</td>
                <td className="py-2">employees:read</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">PATCH</td>
                <td className="py-2 pr-3">/employees/{"{id}"}</td>
                <td className="py-2">employees:write</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">DELETE</td>
                <td className="py-2 pr-3">/employees/{"{id}"}</td>
                <td className="py-2">employees:write</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">POST</td>
                <td className="py-2 pr-3">/employees/{"{id}"}/tasks</td>
                <td className="py-2">tasks:write</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">GET</td>
                <td className="py-2 pr-3">/sessions</td>
                <td className="py-2">sessions:read</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">GET</td>
                <td className="py-2 pr-3">/sessions/{"{id}"}</td>
                <td className="py-2">sessions:read</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-white">POST</td>
                <td className="py-2 pr-3">/workforce/assign</td>
                <td className="py-2">tasks:write</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="responses"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">4. Формат ответа</h3>
        <p className="mt-3">Успех:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">{`{
  "data": { ... },
  "requestId": "uuid"
}`}</pre>
        <p className="mt-4">Ошибка:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">{`{
  "error": "Insufficient API key scope",
  "requestId": "uuid",
  "requiredScopes": ["employees:write"]
}`}</pre>
        <p className="mt-4">
          Заголовок{" "}
          <span className="font-mono text-white">X-Request-Id</span> дублирует{" "}
          <span className="font-mono text-white">requestId</span>.
        </p>
      </section>

      <section
        id="examples"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">5. Примеры</h3>
        <p className="mt-3 text-white/40">Список сотрудников</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">{`curl -H "Authorization: Bearer nx_live_…" \\
  https://www.nullxesdai.online/api/v1/employees`}</pre>
        <p className="mt-4 text-white/40">Создание сотрудника (draft)</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">{`curl -X POST https://www.nullxesdai.online/api/v1/employees \\
  -H "Authorization: Bearer nx_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Atlas","role":"Automation Engineer"}'`}</pre>
        <p className="mt-4 text-white/40">Маршрутизация задачи (workforce assign)</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">{`curl -X POST https://www.nullxesdai.online/api/v1/workforce/assign \\
  -H "Authorization: Bearer nx_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Route to best sales employee","title":"Inbound lead"}'`}</pre>
      </section>

      <section
        id="sdk"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">6. Typed SDK (Orval)</h3>
        <p className="mt-3">
          В репозитории платформы клиент генерируется из{" "}
          <span className="font-mono text-white">public/openapi.yaml</span>:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">{`npm run api:generate`}</pre>
        <p className="mt-4">
          Импорт:{" "}
          <span className="font-mono text-white">
            @/features/public-api/sdk
          </span>
          . Полное ТЗ и probe-скрипты —{" "}
          <span className="font-mono text-white">docs/PUBLIC_API.md</span> в
          репозитории.
        </p>
      </section>

      <section
        id="security"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">7. Безопасность</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Не передавайте ключ в query string или клиентский бандл без необходимости</li>
          <li>Ограничьте scopes минимально необходимым bundle</li>
          <li>При необходимости включите IP allowlist в Settings → Security</li>
          <li>
            Отказы доступа пишутся в Audit (
            <span className="font-mono text-white">api.access.denied</span>)
          </li>
        </ul>
      </section>
    </article>
  );
}

import Link from "next/link";

const DOC_SECTIONS = [
  {
    href: "/docs/functional",
    title: "Описание функциональных характеристик",
    description:
      "Назначение ПО, состав модулей, поддерживаемые сценарии работы с цифровыми сотрудниками, миссиями, аналитикой и интеграциями.",
  },
  {
    href: "/docs/installation",
    title: "Информация для установки",
    description:
      "Системные требования, переменные окружения, развёртывание на Vercel/Neon, миграции базы данных и проверка работоспособности.",
  },
  {
    href: "/docs/operation",
    title: "Информация для эксплуатации",
    description:
      "Руководство пользователя: вход в систему, создание цифрового сотрудника, миссии, разговоры, настройки организации и API.",
  },
] as const;

export default function DocsOverviewPage() {
  return (
    <div className="flex flex-col gap-10">
      <section id="overview" className="scroll-mt-24">
        <h2 className="text-2xl font-medium tracking-tight">Обзор</h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Настоящий раздел размещён на официальном сайте правообладателя
          программного обеспечения{" "}
          <strong className="font-medium text-white">
            NULLXES Digital Employees
          </strong>{" "}
          и содержит сведения, необходимые для проведения экспертизы в
          соответствии с требованиями к документированию программного
          обеспечения.
        </p>
      </section>

      <section
        id="domain"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h2 className="text-sm font-medium text-white">
          Принадлежность доменного имени (п. 4 «ж»)
        </h2>
        <dl className="mt-4 grid gap-3 text-sm text-white/60">
          <div>
            <dt className="text-white/40">Доменное имя</dt>
            <dd className="mt-1 font-mono text-white">nullxesdai.online</dd>
          </div>
          <div>
            <dt className="text-white/40">Адрес размещения документации</dt>
            <dd className="mt-1 font-mono text-white">
              https://www.nullxesdai.online/docs
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Правообладатель / оператор сайта</dt>
            <dd className="mt-1 text-white">NULLXES</dd>
          </div>
          <div>
            <dt className="text-white/40">Программное обеспечение</dt>
            <dd className="mt-1 text-white">
              NULLXES Digital Employees — платформа управления цифровыми
              сотрудниками (Digital Workforce Operating System)
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Сайт{" "}
          <span className="font-mono text-white">nullxesdai.online</span>{" "}
          используется правообладателем для размещения программного обеспечения,
          документации и служебных интерфейсов. Доступ к продуктовым функциям
          осуществляется после аутентификации пользователя организации.
        </p>
      </section>

      <section
        id="llm"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h2 className="text-sm font-medium text-white">
          Обработка текстовых данных (требования к LLM)
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Для задач анализа, структурирования и генерации текстов (в том числе
          обработка результатов веб-поиска, формирование лидов и коммерческих
          предложений в модуле Mission Control) используется{" "}
          <strong className="font-medium text-white">
            исключительно модель OpenAI GPT
          </strong>{" "}
          через официальный API OpenAI. Альтернативные LLM-провайдеры в
          производственном контуре обработки миссий и парсинга не применяются.
          Организация может указать собственный ключ OpenAI в Settings → AI.
        </p>
      </section>

      <section id="sections" className="grid scroll-mt-24 gap-4">
        <h2 className="text-sm font-medium text-white">Разделы документации</h2>
        {DOC_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl border border-white/10 bg-[#111111] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.03]"
          >
            <h3 className="text-sm font-medium text-white">{section.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {section.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="text-sm text-white/50">
        <p>
          OpenAPI спецификация:{" "}
          <Link href="/api/docs" className="text-white hover:underline">
            /api/docs
          </Link>
        </p>
        <p className="mt-2">
          Центр доверия и безопасности:{" "}
          <Link href="/trust" className="text-white hover:underline">
            /trust
          </Link>
        </p>
      </section>
    </div>
  );
}

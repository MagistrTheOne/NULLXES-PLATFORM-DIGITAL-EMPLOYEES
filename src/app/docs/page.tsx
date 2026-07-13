import Link from "next/link";
import { DOCS_LEGAL_ENTITY } from "./_lib/docs-legal";

const DOC_SECTIONS = [
  {
    href: "/docs/installation",
    title: "Установка и настройка",
    description:
      "Системные требования, переменные окружения, миграции и проверка работоспособности.",
  },
  {
    href: "/docs/operation",
    title: "Эксплуатация",
    description:
      "Вход, создание сотрудника, миссии, настройки организации.",
  },
  {
    href: "/docs/talk",
    title: "Talk",
    description: "Диалог с digital employee: старт сессии, лимиты, Talk Ready.",
  },
  {
    href: "/docs/plans",
    title: "Тарифы и лимиты",
    description:
      "Evaluation, Studio, Team, Scale, Enterprise, Government — единая матрица.",
  },
  {
    href: "/docs/api",
    title: "Public API v1",
    description:
      "Scopes, эндпоинты, примеры curl, OpenAPI и typed SDK (Orval).",
  },
  {
    href: "/docs/knowledge",
    title: "Knowledge",
    description: "Источники знаний, индексация и лимиты chunks по тарифу.",
  },
  {
    href: "/docs/troubleshooting",
    title: "Устранение неполадок",
    description: "Talk, API, миссии и тарифы — типовые сбои.",
  },
  {
    href: "/docs/personal-data",
    title: "Персональные данные (152-ФЗ)",
    description:
      "Оператор ПДн, категории данных, хранение, аудит и права субъектов.",
  },
  {
    href: "/docs/terms",
    title: "Пользовательское соглашение",
    description: "Предмет доступа, обязанности сторон и ответственность.",
  },
  {
    href: "/docs/assistant",
    title: "Ассистент GPT-4o",
    description:
      "Yuki Nakora отвечает через OpenAI GPT-4o по корпусу /docs с цитатами.",
  },
  {
    href: "/docs/changelog",
    title: "Changelog",
    description: "История изменений портала документации.",
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
          и содержит сведения для эксплуатации продукта и проведения экспертизы.
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
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.shortName}</dd>
          </div>
          <div>
            <dt className="text-white/40">Программное обеспечение</dt>
            <dd className="mt-1 text-white">
              NULLXES Digital Employees — платформа управления цифровыми
              сотрудниками (Digital Workforce Operating System)
            </dd>
          </div>
        </dl>
      </section>

      <section
        id="legal"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h2 className="text-sm font-medium text-white">
          Реквизиты правообладателя
        </h2>
        <dl className="mt-4 grid gap-3 text-sm text-white/60">
          <div>
            <dt className="text-white/40">Полное наименование</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.fullName}</dd>
          </div>
          <div>
            <dt className="text-white/40">ОГРН</dt>
            <dd className="mt-1 font-mono text-white">{DOCS_LEGAL_ENTITY.ogrn}</dd>
          </div>
          <div>
            <dt className="text-white/40">ИНН / КПП</dt>
            <dd className="mt-1 font-mono text-white">
              {DOCS_LEGAL_ENTITY.inn} / {DOCS_LEGAL_ENTITY.kpp}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Юридический адрес</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.address}</dd>
          </div>
          <div>
            <dt className="text-white/40">
              {DOCS_LEGAL_ENTITY.directorTitle}
            </dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">Email</dt>
            <dd className="mt-1">
              <a
                href={`mailto:${DOCS_LEGAL_ENTITY.email}`}
                className="text-white underline"
              >
                {DOCS_LEGAL_ENTITY.email}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section
        id="llm"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h2 className="text-sm font-medium text-white">
          Обработка текстовых данных (требования к LLM)
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Для миссий и парсинга используется{" "}
          <strong className="font-medium text-white">OpenAI GPT</strong> через
          официальный API. Ассистент документации на{" "}
          <Link href="/docs/assistant" className="text-white underline">
            /docs/assistant
          </Link>{" "}
          отвечает через{" "}
          <strong className="font-medium text-white">OpenAI GPT-4o</strong> по
          корпусу /docs.
        </p>
      </section>

      <section id="sections" className="grid scroll-mt-24 gap-4">
        <h2 className="text-sm font-medium text-white">Разделы документации</h2>
        {DOC_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl border border-white/10 bg-[#111111] p-6 transition-colors hover:border-white/20 hover:bg-white/3"
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
          Public API:{" "}
          <Link href="/docs/api" className="text-white hover:underline">
            /docs/api
          </Link>{" "}
          · OpenAPI:{" "}
          <Link href="/api/docs" className="text-white hover:underline">
            /api/docs
          </Link>
        </p>
        <p className="mt-2">
          Для AI-агентов:{" "}
          <Link href="/llms.txt" className="text-white hover:underline">
            /llms.txt
          </Link>
        </p>
        <p className="mt-2">
          Trust:{" "}
          <Link href="/trust" className="text-white hover:underline">
            /trust
          </Link>
        </p>
      </section>
    </div>
  );
}

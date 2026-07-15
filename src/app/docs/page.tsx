import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/shared/seo";
import { DOCS_LEGAL_ENTITY } from "./_lib/docs-legal";

export const metadata: Metadata = buildPageMetadata({
  title: "Документация NULLXES",
  description:
    "Обзор платформы NULLXES Digital Employees: домен, архитектура, Talk, организации, API и разделы документации.",
  path: "/docs",
});

const DOC_SECTIONS = [
  {
    href: "/docs/architecture",
    title: "Архитектура",
    description: "Пользователь → Workspace → Employees → Knowledge → Talk → LLM → Logs.",
  },
  {
    href: "/docs/employees",
    title: "Цифровые сотрудники",
    description: "Модель workforce, каталог NULLXES, жизненный цикл.",
  },
  {
    href: "/docs/talk",
    title: "Talk",
    description: "Сессии, лимиты, Talk Ready.",
  },
  {
    href: "/docs/organizations",
    title: "Организации",
    description: "Tenant boundary, Owner, Members.",
  },
  {
    href: "/docs/roles",
    title: "Роли",
    description: "Owner · Admin · Operator · Viewer.",
  },
  {
    href: "/docs/api",
    title: "Public API",
    description: "Authentication, endpoints, errors.",
  },
  {
    href: "/docs/api-keys",
    title: "API Keys",
    description: "Создание, scopes, отзыв, rotation.",
  },
  {
    href: "/docs/webhooks",
    title: "Webhooks",
    description: "События и HMAC-подпись.",
  },
  {
    href: "/docs/limits",
    title: "Лимиты",
    description: "Employees, Talk, Knowledge, API — enforcement.",
  },
  {
    href: "/docs/security",
    title: "Безопасность",
    description: "TLS, RBAC, audit, keys, signed webhooks.",
  },
  {
    href: "/docs/enterprise",
    title: "Enterprise",
    description: "Deployment, VPC, SSO, compliance.",
  },
  {
    href: "/docs/assistant",
    title: "Yuki Nakora",
    description: "Помощник по документации.",
  },
] as const;

export default function DocsOverviewPage() {
  return (
    <div className="flex flex-col gap-10">
      <section id="overview" className="scroll-mt-24">
        <h2 className="text-2xl font-medium tracking-tight">Обзор</h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Документация{" "}
          <strong className="font-medium text-white">
            NULLXES Digital Employees
          </strong>{" "}
          — для клиента, интегратора, ИБ и разработчика. Одна тема на страницу.
          Без обучения «как пользоваться компьютером».
        </p>
      </section>

      <section
        id="domain"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h2 className="text-sm font-medium text-white">Домен</h2>
        <dl className="mt-4 grid gap-3 text-sm text-white/60">
          <div>
            <dt className="text-white/40">Документация</dt>
            <dd className="mt-1 font-mono text-white">
              https://www.nullxesdai.online/docs
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Правообладатель</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.fullName}</dd>
          </div>
          <div>
            <dt className="text-white/40">Контакт</dt>
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

      <section id="sections" className="scroll-mt-24">
        <h2 className="text-sm font-medium text-white">Разделы</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DOC_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-white/10 bg-[#111111] p-5 transition-colors hover:border-white/20 hover:bg-white/4"
            >
              <h3 className="text-sm font-medium text-white">{section.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                {section.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

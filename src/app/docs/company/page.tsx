import Link from "next/link";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/company");

export default function DocsCompanyPage() {
  const e = DOCS_LEGAL_ENTITY;

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
          Реквизиты
        </p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-white">
          {e.shortName}
        </h2>
        <p className="mt-4">{e.fullName}</p>
      </header>

      <section
        id="requisites"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Юридические реквизиты</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-white/40">ОГРН</dt>
            <dd className="mt-1 font-mono text-white">{e.ogrn}</dd>
          </div>
          <div>
            <dt className="text-white/40">ИНН / КПП</dt>
            <dd className="mt-1 font-mono text-white">
              {e.inn} / {e.kpp}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">ОКПО</dt>
            <dd className="mt-1 font-mono text-white">{e.okpo}</dd>
          </div>
          <div>
            <dt className="text-white/40">Дата регистрации</dt>
            <dd className="mt-1 text-white">{e.registeredAt}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-white/40">Юридический адрес</dt>
            <dd className="mt-1 text-white">{e.address}</dd>
          </div>
          <div>
            <dt className="text-white/40">{e.directorTitle}</dt>
            <dd className="mt-1 text-white">{e.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">Основной ОКВЭД</dt>
            <dd className="mt-1 text-white">{e.activity}</dd>
          </div>
        </dl>
      </section>

      <section
        id="contacts"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Контакты</h3>
        <ul className="mt-4 space-y-2">
          <li>
            Email:{" "}
            <a href={`mailto:${e.email}`} className="text-white underline">
              {e.email}
            </a>
          </li>
          <li>
            Telegram:{" "}
            <a
              href={e.telegramUrl}
              className="text-white underline"
              target="_blank"
              rel="noreferrer"
            >
              {e.telegram}
            </a>
          </li>
          <li>
            Сайт:{" "}
            <a href={e.siteUrl} className="text-white underline">
              {e.siteUrl}
            </a>
          </li>
          <li>
            ЕГРЮЛ:{" "}
            <a
              href={e.rusprofileUrl}
              className="text-white underline"
              target="_blank"
              rel="noreferrer"
            >
              Rusprofile
            </a>
          </li>
        </ul>
      </section>

      <p className="text-xs text-white/35">
        <Link href="/docs/offer" className="underline">
          Публичная оферта
        </Link>
        {" · "}
        <Link href="/docs/personal-data" className="underline">
          Персональные данные
        </Link>
        {" · "}
        <Link href="/docs/terms" className="underline">
          Соглашение
        </Link>
      </p>
    </article>
  );}

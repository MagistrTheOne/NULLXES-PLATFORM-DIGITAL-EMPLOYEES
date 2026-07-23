import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/company");
}

export default async function DocsCompanyPage() {
  const t = await getTranslations("docs.company");
  const e = DOCS_LEGAL_ENTITY;

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
          {t("label")}
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
        <h3 className="font-medium text-white">{t("requisitesTitle")}</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-white/40">{t("ogrnLabel")}</dt>
            <dd className="mt-1 font-mono text-white">{e.ogrn}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("innKppLabel")}</dt>
            <dd className="mt-1 font-mono text-white">
              {e.inn} / {e.kpp}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">{t("okpoLabel")}</dt>
            <dd className="mt-1 font-mono text-white">{e.okpo}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("registeredAtLabel")}</dt>
            <dd className="mt-1 text-white">{e.registeredAt}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-white/40">{t("addressLabel")}</dt>
            <dd className="mt-1 text-white">{e.address}</dd>
          </div>
          <div>
            <dt className="text-white/40">{e.directorTitle}</dt>
            <dd className="mt-1 text-white">{e.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("activityLabel")}</dt>
            <dd className="mt-1 text-white">{e.activity}</dd>
          </div>
        </dl>
      </section>

      <section
        id="contacts"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("contactsTitle")}</h3>
        <ul className="mt-4 space-y-2">
          <li>
            {t("emailLabel")}:{" "}
            <a href={`mailto:${e.email}`} className="text-white underline">
              {e.email}
            </a>
          </li>
          <li>
            {t("telegramLabel")}:{" "}
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
            {t("siteLabel")}:{" "}
            <a href={e.siteUrl} className="text-white underline">
              {e.siteUrl}
            </a>
          </li>
          <li>
            {t("egrulLabel")}:{" "}
            <a
              href={e.rusprofileUrl}
              className="text-white underline"
              target="_blank"
              rel="noreferrer"
            >
              {t("egrulLink")}
            </a>
          </li>
        </ul>
      </section>

      <p className="text-xs text-white/35">
        <Link href="/docs/offer" className="underline">
          {t("offerLink")}
        </Link>
        {" · "}
        <Link href="/docs/personal-data" className="underline">
          {t("personalDataLink")}
        </Link>
        {" · "}
        <Link href="/docs/terms" className="underline">
          {t("termsLink")}
        </Link>
      </p>
    </article>
  );
}

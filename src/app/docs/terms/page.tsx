import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/terms");
}

export default async function DocsTermsPage() {
  const t = await getTranslations("docs.terms");
  const scopeItems = t.raw("scopeItems") as string[];
  const obligationsItems = t.raw("obligationsItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="operator"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("operatorTitle")}</h3>
        <dl className="mt-4 grid gap-3">
          <div>
            <dt className="text-white/40">{t("nameLabel")}</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.fullName}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("ogrnInnLabel")}</dt>
            <dd className="mt-1 font-mono text-white">
              {DOCS_LEGAL_ENTITY.ogrn} / {DOCS_LEGAL_ENTITY.inn}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">{t("addressLabel")}</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.address}</dd>
          </div>
          <div>
            <dt className="text-white/40">
              {DOCS_LEGAL_ENTITY.directorTitle}
            </dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("contactLabel")}</dt>
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
        id="scope"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("scopeTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {scopeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            {t("scopePersonalDataPrefix")}{" "}
            <Link href="/docs/personal-data" className="text-white underline">
              {t("personalDataLink")}
            </Link>
            .
          </li>
        </ul>
      </section>

      <section
        id="obligations"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("obligationsTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {obligationsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="liability"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("liabilityTitle")}</h3>
        <p className="mt-4">{t("liabilityText")}</p>
      </section>
    </article>
  );
}

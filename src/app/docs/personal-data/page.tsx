import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/personal-data");
}

export default async function DocsPersonalDataPage() {
  const t = await getTranslations("docs.personalData");
  const categoriesItems = t.raw("categoriesItems") as string[];
  const documentsItems = t.raw("documentsItems") as string[];
  const auditItems = t.raw("auditItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro1")}</p>
        <p className="mt-3">{t("intro2")}</p>
      </header>

      <section
        id="operator"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("operatorTitle")}</h3>
        <dl className="mt-4 grid gap-3">
          <div>
            <dt className="text-white/40">{t("fullNameLabel")}</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.fullName}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("ogrnInnKppLabel")}</dt>
            <dd className="mt-1 font-mono text-white">
              {DOCS_LEGAL_ENTITY.ogrn} / {DOCS_LEGAL_ENTITY.inn} /{" "}
              {DOCS_LEGAL_ENTITY.kpp}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">{t("addressLabel")}</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.address}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("directorLabel")}</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("pdContactLabel")}</dt>
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
        id="categories"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("categoriesTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {categoriesItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3">{t("categoriesNote")}</p>
      </section>

      <section
        id="documents"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("documentsTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {documentsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="storage"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("storageTitle")}</h3>
        <p className="mt-3">
          <strong className="text-white">{t("storageElectronicLabel")}</strong>{" "}
          {t("storageElectronicText")}
        </p>
        <p className="mt-3">
          <strong className="text-white">{t("storageAccessLabel")}</strong>{" "}
          {t("storageAccessText")}
        </p>
        <p className="mt-3">
          <strong className="text-white">{t("storageEncryptionLabel")}</strong>{" "}
          {t("storageEncryptionText")}{" "}
          <Link href="/trust" className="text-white underline">
            {t("trustCenterLink")}
          </Link>
          .
        </p>
        <p className="mt-3">
          <strong className="text-white">{t("storageRetentionLabel")}</strong>{" "}
          {t("storageRetentionText")}
        </p>
      </section>

      <section
        id="audit"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("auditTitle")}</h3>
        <p className="mt-3">{t("auditIntro")}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {auditItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3">{t("auditIncident")}</p>
      </section>

      <section
        id="rights"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("rightsTitle")}</h3>
        <p className="mt-3">
          {t("rightsTextPrefix")}{" "}
          <a
            href={`mailto:${DOCS_LEGAL_ENTITY.email}`}
            className="text-white underline"
          >
            {DOCS_LEGAL_ENTITY.email}
          </a>
          . {t("rightsTextSuffix")}
        </p>
      </section>

      <section className="text-xs text-white/45">
        <p>
          {t("relatedPrefix")}{" "}
          <Link href="/trust" className="text-white/70 underline">
            {t("trustCenterLink")}
          </Link>
          ,{" "}
          <Link href="/docs/terms" className="text-white/70 underline">
            {t("termsLink")}
          </Link>
          ,{" "}
          <Link href="/docs/assistant" className="text-white/70 underline">
            {t("assistantLink")}
          </Link>
          . {t("referencePrefix")}{" "}
          <a
            href="https://legal-box.ru/152fz-docs"
            className="text-white/70 underline"
            target="_blank"
            rel="noreferrer"
          >
            legal-box.ru/152fz-docs
          </a>
          .
        </p>
      </section>
    </article>
  );
}

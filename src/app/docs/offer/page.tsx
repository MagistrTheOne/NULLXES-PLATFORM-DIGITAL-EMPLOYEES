import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/offer");
}

export default async function DocsOfferPage() {
  const t = await getTranslations("docs.offer");
  const e = DOCS_LEGAL_ENTITY;
  const orderSteps = t.raw("orderSteps") as string[];
  const refundItems = t.raw("refundItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
          {t("label")}
        </p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-white">
          {t("title", { brand: e.brand })}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="seller"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("sellerTitle")}</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-white/40">{t("fullNameLabel")}</dt>
            <dd className="mt-1 text-white">{e.fullName}</dd>
          </div>
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
          <div className="sm:col-span-2">
            <dt className="text-white/40">{t("addressLabel")}</dt>
            <dd className="mt-1 text-white">{e.address}</dd>
          </div>
          <div>
            <dt className="text-white/40">{e.directorTitle}</dt>
            <dd className="mt-1 text-white">{e.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("contactLabel")}</dt>
            <dd className="mt-1">
              <a href={`mailto:${e.email}`} className="text-white underline">
                {e.email}
              </a>
              {" · "}
              <a
                href={e.telegramUrl}
                className="text-white underline"
                target="_blank"
                rel="noreferrer"
              >
                {e.telegram}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section
        id="subject"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("subjectTitle")}</h3>
        <p className="mt-4">
          {t("subjectText", { brand: e.brand })}{" "}
          <a href={e.siteUrl} className="text-white underline">
            {e.domain}
          </a>
          .
        </p>
      </section>

      <section
        id="prices"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("pricesTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            {t("pricesItem1Prefix")}{" "}
            <Link href="/docs/plans" className="text-white underline">
              {t("plansLink")}
            </Link>{" "}
            {t("pricesItem1Suffix")}
          </li>
          <li>{t("pricesItem2")}</li>
          <li>{t("pricesItem3")}</li>
        </ul>
      </section>

      <section
        id="order"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("orderTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {orderSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4">{t("noPhysicalDelivery")}</p>
      </section>

      <section
        id="refund"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("refundTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            {t("refundItem1Prefix")}{" "}
            <a href={`mailto:${e.email}`} className="text-white underline">
              {e.email}
            </a>{" "}
            {t("refundItem1Suffix")}
          </li>
          {refundItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="personal-data"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("personalDataTitle")}</h3>
        <p className="mt-4">
          {t("personalDataText")}{" "}
          <Link href="/docs/personal-data" className="text-white underline">
            {t("personalDataLink")}
          </Link>
          . {t("personalDataSuffix")}
        </p>
      </section>

      <p className="text-xs text-white/35">
        {t("footerRequisites")}{" "}
        <a
          href={e.rusprofileUrl}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          {t("rusprofileLink")}
        </a>
        . {t("footerAlso")}{" "}
        <Link href="/docs/terms" className="underline">
          {t("termsLink")}
        </Link>
        .
      </p>
    </article>
  );
}

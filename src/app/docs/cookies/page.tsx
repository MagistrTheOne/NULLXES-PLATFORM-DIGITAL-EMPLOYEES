import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/cookies");
}

export default async function DocsCookiesPage() {
  const t = await getTranslations("docs.cookies");
  const registryItems = t.raw("registryItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("overviewTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <span className="text-white/80">{t("categoryNecessaryLabel")}</span>{" "}
            {t("categoryNecessaryBody")}
          </li>
          <li>
            <span className="text-white/80">{t("categoryAnalyticsLabel")}</span>{" "}
            {t("categoryAnalyticsBody")}
          </li>
        </ul>
      </section>

      <section
        id="consent"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("consentTitle")}</h3>
        <p className="mt-4">
          {t("consentBody1")}{" "}
          <code className="text-white/80">nx_cookie_consent</code>{" "}
          {t("consentBody2")}{" "}
          <code className="text-white/80">necessary</code> {t("consentOr")}{" "}
          <code className="text-white/80">all</code>. {t("consentBody3")}
        </p>
      </section>

      <section
        id="registry"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("registryTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {registryItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

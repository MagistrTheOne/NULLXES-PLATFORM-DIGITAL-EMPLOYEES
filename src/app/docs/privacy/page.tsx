import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/privacy");
}

export default async function DocsPrivacyPage() {
  const t = await getTranslations("docs.privacy");

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
            <Link href="/docs/personal-data" className="text-white underline">
              {t("personalDataLink")}
            </Link>
          </li>
          <li>
            <Link href="/docs/terms" className="text-white underline">
              {t("termsLink")}
            </Link>
          </li>
          <li>
            <Link href="/docs/cookies" className="text-white underline">
              {t("cookiesLink")}
            </Link>
          </li>
          <li>
            <Link href="/docs/company" className="text-white underline">
              {t("companyLink")}
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}

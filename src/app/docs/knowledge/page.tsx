import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/knowledge");
}

export default async function DocsKnowledgePage() {
  const t = await getTranslations("docs.knowledge");
  const uploadSteps = t.raw("uploadSteps") as string[];

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
        <p className="mt-3">{t("overviewText")}</p>
      </section>

      <section
        id="upload"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("uploadTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {uploadSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section
        id="limits"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("limitsTitle")}</h3>
        <p className="mt-3">
          {t("limitsText")}{" "}
          <Link href="/docs/plans" className="text-white underline">
            {t("plansLink")}
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/changelog");
}

export default async function DocsChangelogPage() {
  const t = await getTranslations("docs.changelog");
  const v210Items = t.raw("v210Items") as string[];
  const v200Items = t.raw("v200Items") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="recent"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("v210Title")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {v210Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="mt-8 font-medium text-white">{t("v200Title")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {v200Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            {t("agentReadable")}{" "}
            <span className="font-mono text-white">/llms.txt</span>
          </li>
        </ul>
      </section>
    </article>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/employees");
}

export default async function DocsEmployeesPage() {
  const t = await getTranslations("docs.employees");
  const modelItems = t.raw("modelItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="model"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("modelTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {modelItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="catalog"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("catalogTitle")}</h3>
        <p className="mt-3">{t("catalogBody")}</p>
      </section>

      <section
        id="lifecycle"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("lifecycleTitle")}</h3>
        <p className="mt-3 font-mono text-xs text-white/70">
          {t("lifecycleStatus")}
        </p>
        <p className="mt-3">
          {t("lifecycleTalkPrefix")}{" "}
          <Link href="/docs/talk" className="text-white underline">
            {t("talkLink")}
          </Link>
          . {t("lifecycleLimitsPrefix")}{" "}
          <Link href="/docs/limits" className="text-white underline">
            {t("limitsLink")}
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/missions");
}

export default async function DocsMissionsPage() {
  const t = await getTranslations("docs.missions");
  const overviewItems = t.raw("overviewItems") as string[];

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
          {overviewItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="runtime"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("runtimeTitle")}</h3>
        <p className="mt-3">
          {t("runtimeText")}{" "}
          <Link href="/docs/api" className="text-white underline">
            {t("apiTasksLink")}
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

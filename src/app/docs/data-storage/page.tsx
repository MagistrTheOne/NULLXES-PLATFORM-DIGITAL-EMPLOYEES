import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/data-storage");
}

export default async function DocsDataStoragePage() {
  const t = await getTranslations("docs.dataStorage");
  const whereItems = t.raw("whereItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="where"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("whereTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {whereItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-white/45">{t("whereNote")}</p>
      </section>

      <section
        id="retention"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("retentionTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>{t("retentionExport")}</li>
          <li>{t("retentionPurge")}</li>
          <li>
            {t("retentionPersonalDataPrefix")}{" "}
            <Link href="/docs/personal-data" className="text-white underline">
              {t("personalDataLink")}
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}

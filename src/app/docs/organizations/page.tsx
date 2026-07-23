import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/organizations");
}

export default async function DocsOrganizationsPage() {
  const t = await getTranslations("docs.organizations");
  const isolationItems = t.raw("isolationItems") as string[];

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
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/8 bg-black/50 p-4 font-mono text-[12px] leading-6 text-white/75">
          {t("modelTree")}
        </pre>
      </section>

      <section
        id="isolation"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("isolationTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {isolationItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4">
          {t("seeAccessControl")}{" "}
          <Link href="/docs/access-control" className="text-white underline">
            {t("accessControlLink")}
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

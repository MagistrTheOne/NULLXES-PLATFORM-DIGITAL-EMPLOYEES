import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/workspaces");
}

export default async function DocsWorkspacesPage() {
  const t = await getTranslations("docs.workspaces");

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
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/8 bg-black/50 p-4 font-mono text-[12px] leading-6 text-white/75">
          {t("overviewTree")}
        </pre>
        <p className="mt-4">
          {t("overviewDetail")}{" "}
          <Link href="/docs/organizations" className="text-white underline">
            {t("organizationsLink")}
          </Link>
          ,{" "}
          <Link href="/docs/roles" className="text-white underline">
            {t("rolesLink")}
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

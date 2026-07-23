import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/api-keys");
}

export default async function DocsApiKeysPage() {
  const t = await getTranslations("docs.apiKeys");
  const createItems = t.raw("createItems") as string[];
  const scopeItems = t.raw("scopeItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">
          {t("introPrefix")}{" "}
          <span className="font-mono text-white/80">nx_live_</span>
          {t("introSuffix")}
        </p>
      </header>

      <section
        id="create"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("createTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {createItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="scopes"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("scopesTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5 font-mono text-xs text-white/75">
          {scopeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4">
          {t("scopesBundles")}{" "}
          <Link href="/docs/api#auth" className="text-white underline">
            {t("apiLink")}
          </Link>
          .
        </p>
      </section>

      <section
        id="revoke"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("revokeTitle")}</h3>
        <p className="mt-3">{t("revokeBody")}</p>
      </section>
    </article>
  );
}

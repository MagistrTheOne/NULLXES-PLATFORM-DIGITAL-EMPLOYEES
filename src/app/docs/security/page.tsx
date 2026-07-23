import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/security");
}

export default async function DocsSecurityPage() {
  const t = await getTranslations("docs.security");
  const transportItems = t.raw("transportItems") as string[];
  const accessItems = t.raw("accessItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="transport"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("transportTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {transportItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="access"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("accessTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {accessItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="controls"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("controlsTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <Link href="/docs/api-keys" className="text-white underline">
              {t("controlsApiKeysLink")}
            </Link>{" "}
            {t("controlsApiKeysSuffix")}
          </li>
          <li>
            {t("controlsWebhooksPrefix")}{" "}
            <Link href="/docs/webhooks" className="text-white underline">
              {t("controlsWebhooksLink")}
            </Link>
          </li>
          <li>
            <Link href="/docs/audit" className="text-white underline">
              {t("controlsAuditLink")}
            </Link>
          </li>
          <li>{t("controlsCatalogItem")}</li>
        </ul>
      </section>
    </article>
  );
}

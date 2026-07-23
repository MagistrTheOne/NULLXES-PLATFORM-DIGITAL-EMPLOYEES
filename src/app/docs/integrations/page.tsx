import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/integrations");
}

export default async function DocsIntegrationsPage() {
  const t = await getTranslations("docs.integrations");

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
            <Link href="/docs/api" className="text-white underline">
              {t("publicApiLink")}
            </Link>{" "}
            {t("publicApiSuffix")}
          </li>
          <li>
            <Link href="/docs/webhooks" className="text-white underline">
              {t("webhooksLink")}
            </Link>{" "}
            {t("webhooksSuffix")}
          </li>
          <li>{t("avatarItem")}</li>
          <li>{t("billingItem")}</li>
        </ul>
      </section>
    </article>
  );
}

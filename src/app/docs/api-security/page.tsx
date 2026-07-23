import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/api-security");
}

export default async function DocsApiSecurityPage() {
  const t = await getTranslations("docs.apiSecurity");
  const keysItems = t.raw("keysItems") as string[];
  const webhooksItems = t.raw("webhooksItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="keys"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("keysTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {keysItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            {t("keysMore")}{" "}
            <Link href="/docs/api-keys" className="text-white underline">
              {t("apiKeysLink")}
            </Link>
          </li>
        </ul>
      </section>

      <section
        id="webhooks"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("webhooksTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {webhooksItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            {t("webhooksSpec")}{" "}
            <Link href="/docs/webhooks" className="text-white underline">
              {t("webhooksLink")}
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}

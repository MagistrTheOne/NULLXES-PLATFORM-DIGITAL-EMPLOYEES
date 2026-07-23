import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/enterprise");
}

export default async function DocsEnterprisePage() {
  const t = await getTranslations("docs.enterprise");
  const deploymentItems = t.raw("deploymentItems") as string[];
  const identityItems = t.raw("identityItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="deployment"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("deploymentTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {deploymentItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="identity"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("identityTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {identityItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="compliance"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("complianceTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <Link href="/docs/audit" className="text-white underline">
              {t("complianceAuditLink")}
            </Link>
          </li>
          <li>
            <Link href="/docs/personal-data" className="text-white underline">
              {t("compliancePersonalDataLink")}
            </Link>
          </li>
          <li>
            <Link href="/docs/security" className="text-white underline">
              {t("complianceSecurityLink")}
            </Link>
          </li>
          <li>
            <Link href="/docs/data-storage" className="text-white underline">
              {t("complianceDataStorageLink")}
            </Link>
          </li>
        </ul>
        <p className="mt-4">
          {t("contactPrefix")}{" "}
          <a href="mailto:ceo@nullxes.com" className="text-white underline">
            ceo@nullxes.com
          </a>
        </p>
      </section>
    </article>
  );
}

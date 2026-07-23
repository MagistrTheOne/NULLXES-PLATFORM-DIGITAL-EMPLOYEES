import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/shared/seo";
import { DOCS_LEGAL_ENTITY } from "./_lib/docs-legal";

export async function generateMetadata() {
  const t = await getTranslations("docs.overviewMeta");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/docs",
  });
}

const SECTION_HREFS = [
  "/docs/architecture",
  "/docs/employees",
  "/docs/talk",
  "/docs/organizations",
  "/docs/roles",
  "/docs/api",
  "/docs/api-keys",
  "/docs/webhooks",
  "/docs/limits",
  "/docs/security",
  "/docs/enterprise",
  "/docs/assistant",
] as const;

export default async function DocsOverviewPage() {
  const t = await getTranslations("docs.overview");
  const sections = t.raw("sections") as { title: string; description: string }[];

  return (
    <div className="flex flex-col gap-10">
      <section id="overview" className="scroll-mt-24">
        <h2 className="text-2xl font-medium tracking-tight">{t("title")}</h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          {t.rich("intro", {
            strong: (chunks) => (
              <strong className="font-medium text-white">{chunks}</strong>
            ),
          })}
        </p>
      </section>

      <section
        id="domain"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h2 className="text-sm font-medium text-white">{t("domainTitle")}</h2>
        <dl className="mt-4 grid gap-3 text-sm text-white/60">
          <div>
            <dt className="text-white/40">{t("domainDocsLabel")}</dt>
            <dd className="mt-1 font-mono text-white">
              https://www.nullxesdai.online/docs
            </dd>
          </div>
          <div>
            <dt className="text-white/40">{t("domainRightsHolderLabel")}</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.fullName}</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("domainContactLabel")}</dt>
            <dd className="mt-1">
              <a
                href={`mailto:${DOCS_LEGAL_ENTITY.email}`}
                className="text-white underline"
              >
                {DOCS_LEGAL_ENTITY.email}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section id="sections" className="scroll-mt-24">
        <h2 className="text-sm font-medium text-white">{t("sectionsTitle")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sections.map((section, index) => (
            <Link
              key={SECTION_HREFS[index]}
              href={SECTION_HREFS[index]}
              className="rounded-2xl border border-white/10 bg-[#111111] p-5 transition-colors hover:border-white/20 hover:bg-white/4"
            >
              <h3 className="text-sm font-medium text-white">{section.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                {section.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

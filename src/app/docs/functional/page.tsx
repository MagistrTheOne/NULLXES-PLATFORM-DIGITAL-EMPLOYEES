import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/functional");
}

export default async function DocsFunctionalPage() {
  const t = await getTranslations("docs.functional");
  const capabilitiesItems = t.raw("capabilitiesItems") as string[];
  const securityItems = t.raw("securityItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">
          {t.rich("intro", {
            strong: (chunks) => (
              <strong className="font-medium text-white">{chunks}</strong>
            ),
          })}
        </p>
      </header>

      <section
        id="purpose"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("purposeTitle")}</h3>
        <p className="mt-3">{t("purposeText")}</p>
      </section>

      <section
        id="capabilities"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("capabilitiesTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {capabilitiesItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="governance"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("governanceTitle")}</h3>
        <p className="mt-3">{t("governanceText1")}</p>
        <p className="mt-3">{t("governanceText2")}</p>
      </section>

      <section
        id="security"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("securityTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {securityItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="deployment"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("deploymentTitle")}</h3>
        <p className="mt-3">{t("deploymentText1")}</p>
        <p className="mt-3">{t("deploymentText2")}</p>
      </section>

      <section
        id="roles"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("rolesTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>{t("roleAdmin")}</li>
          <li>{t("roleUser")}</li>
        </ul>
      </section>
    </article>
  );
}

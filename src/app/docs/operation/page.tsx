import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/operation");
}

export default async function DocsOperationPage() {
  const t = await getTranslations("docs.operation");
  const loginSteps = t.raw("loginSteps") as string[];
  const createSteps = t.raw("createSteps") as string[];
  const talkSteps = t.raw("talkSteps") as string[];
  const missionsSteps = t.raw("missionsSteps") as string[];
  const apiItems = t.raw("apiItems") as string[];
  const monitoringItems = t.raw("monitoringItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="login"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("loginTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {loginSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section
        id="create"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("createTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {createSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section
        id="talk"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("talkTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {talkSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section
        id="missions"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("missionsTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {missionsSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4">{t("missionsNote")}</p>
      </section>

      <section
        id="settings"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("settingsTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            {t("settingsGeneral")} (
            <Link href="/dashboard/settings" className="text-white underline">
              /dashboard/settings
            </Link>
            )
          </li>
          <li>{t("settingsTeam")}</li>
          <li>{t("settingsAi")}</li>
          <li>{t("settingsSecurity")}</li>
          <li>{t("settingsAdvanced")}</li>
        </ul>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("apiTitle")}</h3>
        <p className="mt-3">
          {t("apiIntro")}{" "}
          <a href="/docs/api" className="text-white underline">
            /docs/api
          </a>
          . {t("apiIntroSuffix")}{" "}
          <a href="/api/docs" className="font-mono text-white underline">
            GET /api/docs
          </a>
          .
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {apiItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="monitoring"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("monitoringTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {monitoringItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

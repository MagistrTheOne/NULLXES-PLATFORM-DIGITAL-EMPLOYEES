import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/talk");
}

export default async function DocsTalkPage() {
  const t = await getTranslations("docs.talk");
  const startSteps = t.raw("startSteps") as string[];

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
            {t("overviewBrain")}{" "}
            <span className="font-mono text-white">
              POST /api/talk/brain-stream
            </span>
          </li>
          <li>{t("overviewAnam")}</li>
          <li>
            {t("overviewHistoryPrefix")}{" "}
            <Link href="/dashboard/conversations" className="text-white underline">
              {t("overviewHistoryLink")}
            </Link>
          </li>
        </ul>
      </section>

      <section
        id="start"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("startTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {startSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section
        id="limits"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("limitsTitle")}</h3>
        <p className="mt-3">
          {t("limitsBody")}{" "}
          <Link href="/docs/plans" className="text-white underline">
            {t("plansLink")}
          </Link>
          .
        </p>
      </section>

      <section
        id="ready"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("readyTitle")}</h3>
        <p className="mt-3">
          {t("readyBody")}{" "}
          <Link href="/docs/troubleshooting#talk" className="text-white underline">
            {t("troubleshootingLink")}
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

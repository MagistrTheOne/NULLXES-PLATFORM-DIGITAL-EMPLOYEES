import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/troubleshooting");
}

export default async function DocsTroubleshootingPage() {
  const t = await getTranslations("docs.troubleshooting");
  const apiItems = t.raw("apiItems") as string[];
  const missionsItems = t.raw("missionsItems") as string[];
  const billingItems = t.raw("billingItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">
          {t("introPrefix")}{" "}
          <a href="mailto:ceo@nullxes.com" className="text-white underline">
            ceo@nullxes.com
          </a>{" "}
          {t("introMiddle")}{" "}
          <Link href="/docs/assistant" className="text-white underline">
            {t("assistantLink")}
          </Link>
          .
        </p>
      </header>

      <section
        id="talk"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("talkTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>{t("talkNotReady")}</li>
          <li>
            {t("talkLimitsPrefix")}{" "}
            <Link href="/docs/plans" className="text-white underline">
              {t("plansLink")}
            </Link>
          </li>
          <li>{t("talkRateLimit")}</li>
        </ul>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("apiTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {apiItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            {t("apiSpecPrefix")}{" "}
            <Link href="/docs/api" className="text-white underline">
              {t("apiLink")}
            </Link>
          </li>
        </ul>
      </section>

      <section
        id="missions"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("missionsTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {missionsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="billing"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("billingTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {billingItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

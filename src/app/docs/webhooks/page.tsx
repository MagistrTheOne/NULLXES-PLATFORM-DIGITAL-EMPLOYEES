import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/webhooks");
}

export default async function DocsWebhooksPage() {
  const t = await getTranslations("docs.webhooks");
  const events = t.raw("events") as string[];
  const signingItems = t.raw("signingItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="events"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("eventsTitle")}</h3>
        <ul className="mt-4 list-disc space-y-1 pl-5 font-mono text-xs text-white/75">
          {events.map((event) => (
            <li key={event}>{event}</li>
          ))}
        </ul>
      </section>

      <section
        id="signing"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("signingTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            {signingItems[0].split(": ")[0]}:{" "}
            <span className="font-mono text-white/75">
              {signingItems[0].split(": ")[1]}
            </span>
          </li>
          <li>
            {signingItems[1].split("${timestamp}.${body}")[0]}
            <span className="font-mono text-white/75">
              {"${timestamp}.${body}"}
            </span>
            {signingItems[1].split("${timestamp}.${body}")[1]}
          </li>
          <li>{signingItems[2]}</li>
        </ul>
      </section>

      <section
        id="setup"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("setupTitle")}</h3>
        <p className="mt-3">
          {t("setupPrefix")}{" "}
          <Link href="/docs/api-security" className="text-white underline">
            {t("apiSecurityLink")}
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

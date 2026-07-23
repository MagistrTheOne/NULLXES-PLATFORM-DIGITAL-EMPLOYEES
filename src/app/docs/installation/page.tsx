import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";

export async function generateMetadata() {
  return docsPageMetadata("/docs/installation");
}

export default async function DocsInstallationPage() {
  const t = await getTranslations("docs.installation");
  const requirementsItems = t.raw("requirementsItems") as string[];
  const verifySteps = t.raw("verifySteps") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="requirements"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("requirementsTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {requirementsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="source"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("sourceTitle")}</h3>
        <p className="mt-3">{t("sourcePolicy")}</p>
        <p className="mt-3">
          {t("sourceRequest")}{" "}
          <a
            href={`mailto:${DOCS_LEGAL_ENTITY.email}`}
            className="text-white underline"
          >
            {DOCS_LEGAL_ENTITY.email}
          </a>
          {" · "}
          <a
            href="https://t.me/MagistrTheOne"
            className="text-white underline"
            target="_blank"
            rel="noreferrer"
          >
            {DOCS_LEGAL_ENTITY.telegram}
          </a>
        </p>
      </section>

      <section
        id="env"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("envTitle")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-4">{t("envVarHeader")}</th>
                <th className="py-2">{t("envPurposeHeader")}</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">DATABASE_URL</td>
                <td className="py-2 text-white/60">{t("envDatabaseUrl")}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">BETTER_AUTH_SECRET</td>
                <td className="py-2 text-white/60">{t("envBetterAuthSecret")}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">BETTER_AUTH_URL</td>
                <td className="py-2 text-white/60">{t("envBetterAuthUrl")}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">NEXT_PUBLIC_BETTER_AUTH_URL</td>
                <td className="py-2 text-white/60">
                  {t("envNextPublicBetterAuthUrl")}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">DATA_ENCRYPTION_KEY</td>
                <td className="py-2 text-white/60">{t("envDataEncryptionKey")}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">OPENAI_API_KEY</td>
                <td className="py-2 text-white/60">{t("envOpenAiApiKey")}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">INNGEST_EVENT_KEY</td>
                <td className="py-2 text-white/60">{t("envInngestEventKey")}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 text-white">INNGEST_SIGNING_KEY</td>
                <td className="py-2 text-white/60">{t("envInngestSigningKey")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-white">RESEND_API_KEY</td>
                <td className="py-2 text-white/60">{t("envResendApiKey")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">{t("envNote")}</p>
      </section>

      <section
        id="verify"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("verifyTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {verifySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}

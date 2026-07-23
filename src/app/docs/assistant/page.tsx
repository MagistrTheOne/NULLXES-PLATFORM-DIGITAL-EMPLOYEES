import { getTranslations } from "next-intl/server";
import { DocsAssistantChat } from "../_components/docs-assistant-chat";
import { getDocsAssistantProfile } from "../_lib/get-docs-assistant";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/assistant");
}

export const revalidate = 300;

export default async function DocsAssistantPage() {
  const t = await getTranslations("docs.assistant");
  const assistant = await getDocsAssistantProfile();

  return (
    <article className="flex flex-col gap-8">
      <header id="assistant" className="scroll-mt-24">
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          {t("intro")}
        </p>
      </header>

      <DocsAssistantChat assistant={assistant} />

      <section
        id="contacts"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6 text-sm text-white/60"
      >
        <h3 className="font-medium text-white">{t("contactsTitle")}</h3>
        <ul className="mt-4 space-y-2">
          <li>
            {t("directorLabel")}{" "}
            <span className="text-white">{t("directorName")}</span>
          </li>
          <li>
            {t("emailLabel")}{" "}
            <a href="mailto:ceo@nullxes.com" className="text-white underline">
              ceo@nullxes.com
            </a>
          </li>
          <li>
            {t("telegramLabel")}{" "}
            <a
              href="https://t.me/MagistrTheOne"
              className="text-white underline"
              target="_blank"
              rel="noreferrer"
            >
              @MagistrTheOne
            </a>
          </li>
        </ul>
      </section>
    </article>
  );
}

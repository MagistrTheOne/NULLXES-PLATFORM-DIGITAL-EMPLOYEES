import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DocsMermaid } from "../_components/docs-mermaid";
import { docsPageMetadata } from "../_lib/docs-page-metadata";
import {
  ARCH_C4_CONTAINER,
  ARCH_ERD,
  ARCH_MISSION_FLOW,
  ARCH_TALK_SEQUENCE,
} from "../_lib/architecture-diagrams";

export async function generateMetadata() {
  return docsPageMetadata("/docs/architecture");
}

export default async function DocsArchitecturePage() {
  const t = await getTranslations("docs.architecture");
  const stackItems = t.raw("stackItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="stack"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("stackTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {stackItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        id="c4"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("c4Title")}</h3>
        <p className="mt-3">{t("c4Text")}</p>
        <div className="mt-5">
          <DocsMermaid chart={ARCH_C4_CONTAINER} title="C4 Container" />
        </div>
      </section>

      <section
        id="flow"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("talkTitle")}</h3>
        <p className="mt-3">{t("talkText")}</p>
        <div className="mt-5">
          <DocsMermaid chart={ARCH_TALK_SEQUENCE} title="Talk turn" />
        </div>
      </section>

      <section
        id="missions"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("missionsTitle")}</h3>
        <div className="mt-5">
          <DocsMermaid chart={ARCH_MISSION_FLOW} title="Mission lifecycle" />
        </div>
      </section>

      <section
        id="erd"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("erdTitle")}</h3>
        <p className="mt-3">{t("erdText")}</p>
        <div className="mt-5">
          <DocsMermaid chart={ARCH_ERD} title="Core ERD" />
        </div>
        <p className="mt-4">
          {t("erdSeeAlso")}{" "}
          <Link href="/docs/organizations" className="text-white underline">
            {t("organizationsLink")}
          </Link>
          ,{" "}
          <Link href="/docs/security" className="text-white underline">
            {t("securityLink")}
          </Link>
          ,{" "}
          <Link href="/docs/talk" className="text-white underline">
            {t("talkLink")}
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/enterprise");

export default function DocsEnterprisePage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Enterprise
        </h2>
        <p className="mt-4">
          Контур для банков, холдингов и регуляторных внедрений. Часть пунктов —
          доступна сейчас, часть — roadmap (явно помечено).
        </p>
      </header>

      <section
        id="deployment"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Deployment</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Enterprise Deployment (managed)</li>
          <li>Private Cloud / VPC</li>
          <li>On-Premise — по договору</li>
          <li>RU data contour — отдельная БД + object storage (cutover)</li>
        </ul>
      </section>

      <section
        id="identity"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Identity</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>SSO — Enterprise</li>
          <li>SAML — roadmap</li>
          <li>SCIM — roadmap</li>
        </ul>
      </section>

      <section
        id="compliance"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Compliance</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <Link href="/docs/audit" className="text-white underline">
              Audit
            </Link>
          </li>
          <li>
            <Link href="/docs/personal-data" className="text-white underline">
              152-ФЗ / ПДн
            </Link>
          </li>
          <li>
            <Link href="/docs/security" className="text-white underline">
              Security controls
            </Link>
          </li>
          <li>
            <Link href="/docs/data-storage" className="text-white underline">
              Data storage
            </Link>
          </li>
        </ul>
        <p className="mt-4">
          Контакт:{" "}
          <a href="mailto:ceo@nullxes.com" className="text-white underline">
            ceo@nullxes.com
          </a>
        </p>
      </section>
    </article>
  );}

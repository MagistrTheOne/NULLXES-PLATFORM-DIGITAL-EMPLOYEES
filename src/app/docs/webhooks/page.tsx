import Link from "next/link";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/webhooks");

export default function DocsWebhooksPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Webhooks
        </h2>
        <p className="mt-4">
          Исходящие события организации на ваш HTTPS endpoint. Подпись
          HMAC-SHA256.
        </p>
      </header>

      <section
        id="events"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">События</h3>
        <ul className="mt-4 list-disc space-y-1 pl-5 font-mono text-xs text-white/75">
          <li>employee.created</li>
          <li>employee.deleted</li>
          <li>session.completed</li>
          <li>session.summarized</li>
          <li>task.completed</li>
          <li>handoff.accepted</li>
        </ul>
      </section>

      <section
        id="signing"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Подпись</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Headers:{" "}
            <span className="font-mono text-white/75">
              X-NULLXES-Event, X-NULLXES-Timestamp, X-NULLXES-Signature
            </span>
          </li>
          <li>
            Подпись: HMAC-SHA256 от{" "}
            <span className="font-mono text-white/75">
              {"${timestamp}.${body}"}
            </span>
          </li>
          <li>Проверяйте timestamp (replay window) и signature (timing-safe)</li>
        </ul>
      </section>

      <section
        id="setup"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Настройка</h3>
        <p className="mt-3">
          Settings → Security → Outbound webhook (Owner). См.{" "}
          <Link href="/docs/api-security" className="text-white underline">
            API Security
          </Link>
          .
        </p>
      </section>
    </article>
  );}

import Link from "next/link";
import { DocsMermaid } from "../_components/docs-mermaid";
import {
  ARCH_C4_CONTAINER,
  ARCH_ERD,
  ARCH_MISSION_FLOW,
  ARCH_TALK_SEQUENCE,
} from "../_lib/architecture-diagrams";

export default function DocsArchitecturePage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Архитектура платформы
        </h2>
        <p className="mt-4">
          NULLXES Digital Employees — операционная система цифровой рабочей силы.
          Схемы в Mermaid (source of truth для агентов и ревью).
        </p>
      </header>

      <section
        id="stack"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Стек</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <span className="text-white">App</span> — Next.js 16 App Router,
            React 19, TypeScript
          </li>
          <li>
            <span className="text-white">Data</span> — Neon PostgreSQL, Drizzle
            ORM
          </li>
          <li>
            <span className="text-white">Auth</span> — Better Auth, org RBAC, 2FA
          </li>
          <li>
            <span className="text-white">Jobs</span> — Inngest (missions, tasks,
            outbound)
          </li>
          <li>
            <span className="text-white">Runtime</span> — Talk brain-stream +
            avatar/voice providers
          </li>
        </ul>
      </section>

      <section
        id="c4"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">C4 — Containers</h3>
        <p className="mt-3">
          Оператор работает с веб-приложением; API и workers разделяют синхронный
          и фоновый контуры над одной БД.
        </p>
        <div className="mt-5">
          <DocsMermaid chart={ARCH_C4_CONTAINER} title="C4 Container" />
        </div>
      </section>

      <section
        id="flow"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Talk — sequence</h3>
        <p className="mt-3">
          Каждый turn получает live snapshot миссий/задач; read-tools всегда
          доступны модели.
        </p>
        <div className="mt-5">
          <DocsMermaid chart={ARCH_TALK_SEQUENCE} title="Talk turn" />
        </div>
      </section>

      <section
        id="missions"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Missions — flow</h3>
        <div className="mt-5">
          <DocsMermaid chart={ARCH_MISSION_FLOW} title="Mission lifecycle" />
        </div>
      </section>

      <section
        id="erd"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">ERD — ядро</h3>
        <p className="mt-3">
          Catalog employees публикуются через{" "}
          <span className="font-mono text-white/80">platform_employee_catalog</span>{" "}
          и не дублируются в org-списке home-org.
        </p>
        <div className="mt-5">
          <DocsMermaid chart={ARCH_ERD} title="Core ERD" />
        </div>
        <p className="mt-4">
          См. также{" "}
          <Link href="/docs/organizations" className="text-white underline">
            организации
          </Link>
          ,{" "}
          <Link href="/docs/security" className="text-white underline">
            безопасность
          </Link>
          ,{" "}
          <Link href="/docs/talk" className="text-white underline">
            Talk
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

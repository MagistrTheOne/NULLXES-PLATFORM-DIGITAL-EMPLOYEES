import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/api");
}

const SUCCESS_RESPONSE = `{
  "data": { ... },
  "requestId": "uuid"
}`;

const ERROR_RESPONSE = `{
  "error": "Insufficient API key scope",
  "requestId": "uuid",
  "requiredScopes": ["employees:write"]
}`;

const EXAMPLE_LIST = `curl -H "Authorization: Bearer nx_live_…" \\
  https://www.nullxesdai.online/api/v1/employees`;

const EXAMPLE_CREATE = `curl -X POST https://www.nullxesdai.online/api/v1/employees \\
  -H "Authorization: Bearer nx_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Atlas","role":"Automation Engineer"}'`;

const EXAMPLE_ASSIGN = `curl -X POST https://www.nullxesdai.online/api/v1/workforce/assign \\
  -H "Authorization: Bearer nx_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Route to best sales employee","title":"Inbound lead"}'`;

export default async function DocsApiPage() {
  const t = await getTranslations("docs.api");
  const authSteps = t.raw("authSteps") as string[];
  const securityItems = t.raw("securityItems") as string[];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-[13px]">
          <Link
            href="/api/docs"
            className="rounded-md border border-white/10 bg-[#111111] px-3 py-1.5 font-mono text-white transition-colors hover:border-white/20"
          >
            GET /api/docs
          </Link>
          <Link
            href="/docs/operation#api"
            className="rounded-md border border-white/10 px-3 py-1.5 text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            {t("operationLink")}
          </Link>
        </div>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("overviewTitle")}</h3>
        <dl className="mt-4 grid gap-3">
          <div>
            <dt className="text-white/40">{t("baseUrlLabel")}</dt>
            <dd className="mt-1 font-mono text-white">/api/v1</dd>
          </div>
          <div>
            <dt className="text-white/40">{t("productionLabel")}</dt>
            <dd className="mt-1 font-mono text-white">
              https://www.nullxesdai.online/api/v1
            </dd>
          </div>
          <div>
            <dt className="text-white/40">{t("authLabel")}</dt>
            <dd className="mt-1 font-mono text-white">
              Authorization: Bearer nx_live_…
            </dd>
          </div>
          <div>
            <dt className="text-white/40">{t("specLabel")}</dt>
            <dd className="mt-1">
              <Link href="/api/docs" className="font-mono text-white underline">
                /api/docs
              </Link>{" "}
              {t("specSuffix")}
            </dd>
          </div>
        </dl>
        <p className="mt-4">{t("overviewNote")}</p>
      </section>

      <section
        id="auth"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("authTitle")}</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {authSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-md text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-4 font-medium">{t("scopeHeader")}</th>
                <th className="py-2 font-medium">{t("accessHeader")}</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-white">employees:read</td>
                <td className="py-2">{t("scopeEmployeesRead")}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-white">employees:write</td>
                <td className="py-2">{t("scopeEmployeesWrite")}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-white">sessions:read</td>
                <td className="py-2">{t("scopeSessionsRead")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-white">tasks:write</td>
                <td className="py-2">{t("scopeTasksWrite")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">{t("planNote")}</p>
      </section>

      <section
        id="endpoints"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("endpointsTitle")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-lg text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-2 pr-3 font-medium">{t("methodHeader")}</th>
                <th className="py-2 pr-3 font-medium">{t("pathHeader")}</th>
                <th className="py-2 font-medium">{t("scopeHeader")}</th>
              </tr>
            </thead>
            <tbody className="font-mono text-white/70">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">GET</td>
                <td className="py-2 pr-3">/employees</td>
                <td className="py-2">employees:read</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">POST</td>
                <td className="py-2 pr-3">/employees</td>
                <td className="py-2">employees:write</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">GET</td>
                <td className="py-2 pr-3">/employees/{"{id}"}</td>
                <td className="py-2">employees:read</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">PATCH</td>
                <td className="py-2 pr-3">/employees/{"{id}"}</td>
                <td className="py-2">employees:write</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">DELETE</td>
                <td className="py-2 pr-3">/employees/{"{id}"}</td>
                <td className="py-2">employees:write</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">POST</td>
                <td className="py-2 pr-3">/employees/{"{id}"}/tasks</td>
                <td className="py-2">tasks:write</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">GET</td>
                <td className="py-2 pr-3">/sessions</td>
                <td className="py-2">sessions:read</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-3 text-white">GET</td>
                <td className="py-2 pr-3">/sessions/{"{id}"}</td>
                <td className="py-2">sessions:read</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-white">POST</td>
                <td className="py-2 pr-3">/workforce/assign</td>
                <td className="py-2">tasks:write</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="responses"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("responsesTitle")}</h3>
        <p className="mt-3">{t("successLabel")}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">
          {SUCCESS_RESPONSE}
        </pre>
        <p className="mt-4">{t("errorLabel")}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">
          {ERROR_RESPONSE}
        </pre>
        <p className="mt-4">{t("requestIdNote")}</p>
      </section>

      <section
        id="examples"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("examplesTitle")}</h3>
        <p className="mt-3 text-white/40">{t("exampleListEmployees")}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">
          {EXAMPLE_LIST}
        </pre>
        <p className="mt-4 text-white/40">{t("exampleCreateEmployee")}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">
          {EXAMPLE_CREATE}
        </pre>
        <p className="mt-4 text-white/40">{t("exampleWorkforceAssign")}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">
          {EXAMPLE_ASSIGN}
        </pre>
      </section>

      <section
        id="sdk"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("sdkTitle")}</h3>
        <p className="mt-3">{t("sdkIntro")}</p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-white/80">
          npm run api:generate
        </pre>
        <p className="mt-4">{t("sdkImport")}</p>
      </section>

      <section
        id="security"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("securityTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {securityItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

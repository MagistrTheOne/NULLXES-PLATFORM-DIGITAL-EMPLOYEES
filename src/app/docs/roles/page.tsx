import { getTranslations } from "next-intl/server";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export async function generateMetadata() {
  return docsPageMetadata("/docs/roles");
}

export default async function DocsRolesPage() {
  const t = await getTranslations("docs.roles");
  const matrixRows = t.raw("matrixRows") as string[][];

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          {t("title")}
        </h2>
        <p className="mt-4">{t("intro")}</p>
      </header>

      <section
        id="roles"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("rolesTitle")}</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>{t("roleOwner")}</li>
          <li>{t("roleAdmin")}</li>
          <li>{t("roleOperator")}</li>
          <li>{t("roleViewer")}</li>
        </ul>
      </section>

      <section
        id="matrix"
        className="scroll-mt-24 overflow-x-auto rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">{t("matrixTitle")}</h3>
        <table className="mt-4 w-full min-w-lg border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-white/45">
              <th className="py-2 pr-3 font-medium">{t("matrixHeaderRight")}</th>
              <th className="py-2 px-2 font-medium">{t("matrixHeaderOwner")}</th>
              <th className="py-2 px-2 font-medium">{t("matrixHeaderAdmin")}</th>
              <th className="py-2 px-2 font-medium">
                {t("matrixHeaderOperator")}
              </th>
              <th className="py-2 px-2 font-medium">
                {t("matrixHeaderViewer")}
              </th>
            </tr>
          </thead>
          <tbody className="text-white/70">
            {matrixRows.map(([label, ...cells]) => (
              <tr key={label} className="border-b border-white/5">
                <td className="py-2 pr-3 text-white/55">{label}</td>
                {cells.map((cell) => (
                  <td key={`${label}-${cell}`} className="py-2 px-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}

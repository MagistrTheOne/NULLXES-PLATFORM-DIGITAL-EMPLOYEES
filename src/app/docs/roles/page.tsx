import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/roles");

export default function DocsRolesPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Пользователи и роли
        </h2>
        <p className="mt-4">
          Membership role в организации. Реализовано: owner, admin, operator,
          viewer.
        </p>
      </header>

      <section
        id="roles"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Роли</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <span className="text-white">Owner</span> — организация, биллинг,
            API keys, webhooks, удаление org
          </li>
          <li>
            <span className="text-white">Administrator</span> — участники и
            сотрудники
          </li>
          <li>
            <span className="text-white">Operator</span> — эксплуатация
            сотрудников (Talk, миссии)
          </li>
          <li>
            <span className="text-white">Viewer</span> — только просмотр
          </li>
        </ul>
      </section>

      <section
        id="matrix"
        className="scroll-mt-24 overflow-x-auto rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Матрица прав</h3>
        <table className="mt-4 w-full min-w-lg border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-white/45">
              <th className="py-2 pr-3 font-medium">Право</th>
              <th className="py-2 px-2 font-medium">Owner</th>
              <th className="py-2 px-2 font-medium">Admin</th>
              <th className="py-2 px-2 font-medium">Operator</th>
              <th className="py-2 px-2 font-medium">Viewer</th>
            </tr>
          </thead>
          <tbody className="text-white/70">
            {[
              ["Manage organization", "✓", "—", "—", "—"],
              ["Manage members", "✓", "✓", "—", "—"],
              ["Manage employees", "✓", "✓", "—", "—"],
              ["Operate employees", "✓", "✓", "✓", "—"],
              ["View employees", "✓", "✓", "✓", "✓"],
            ].map(([label, ...cells]) => (
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

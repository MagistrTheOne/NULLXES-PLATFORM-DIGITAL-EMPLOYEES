import Link from "next/link";

export default function DocsLimitsPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Лимиты платформы
        </h2>
        <p className="mt-4">
          Технические потолки по организации. Не путать с маркетинговым описанием
          тарифа — здесь числа enforcement.
        </p>
      </header>

      <section
        id="workforce"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Workforce</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>maxEmployees — кастомные сотрудники (каталог не считается)</li>
          <li>maxSeats — участники workspace</li>
          <li>maxOrganizations — org на аккаунт (по плану)</li>
          <li>canCreateEmployees — флаг создания</li>
        </ul>
      </section>

      <section
        id="talk"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Talk</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>maxSessionSeconds — длительность одной сессии</li>
          <li>maxTalkMinutesPerMonth — месячный бюджет минут</li>
        </ul>
      </section>

      <section
        id="knowledge"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Knowledge</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>maxKnowledgeChunks — объём индексируемых chunks</li>
          <li>Размер и тип файлов — при загрузке в UI</li>
        </ul>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">API</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>apiAccess: none | read | full</li>
          <li>Rate limits — на уровне платформы и ключа</li>
        </ul>
        <p className="mt-4">
          Матрица по тарифам:{" "}
          <Link href="/docs/plans" className="text-white underline">
            /docs/plans
          </Link>
          .
        </p>
      </section>
    </article>
  );
}

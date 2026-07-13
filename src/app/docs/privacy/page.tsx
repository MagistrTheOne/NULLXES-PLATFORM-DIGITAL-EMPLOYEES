import Link from "next/link";

export default function DocsPrivacyPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Политика конфиденциальности
        </h2>
        <p className="mt-4">
          Краткий указатель. Полный комплект по ПДн — в разделе персональных
          данных и оферте.
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Обзор</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <Link href="/docs/personal-data" className="text-white underline">
              Политика обработки персональных данных
            </Link>
          </li>
          <li>
            <Link href="/docs/terms" className="text-white underline">
              Пользовательское соглашение
            </Link>
          </li>
          <li>
            <Link href="/docs/cookies" className="text-white underline">
              Cookie
            </Link>
          </li>
          <li>
            <Link href="/docs/company" className="text-white underline">
              Реквизиты оператора
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}

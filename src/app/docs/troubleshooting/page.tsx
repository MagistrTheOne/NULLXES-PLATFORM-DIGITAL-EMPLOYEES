import Link from "next/link";

export default function DocsTroubleshootingPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Устранение неполадок
        </h2>
        <p className="mt-4">
          Типовые сбои и что проверить. Если не помогло —{" "}
          <a href="mailto:ceo@nullxes.com" className="text-white underline">
            ceo@nullxes.com
          </a>{" "}
          или{" "}
          <Link href="/docs/assistant" className="text-white underline">
            помощник Yuki Nakora
          </Link>
          .
        </p>
      </header>

      <section
        id="talk"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Talk</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Нет Talk Ready — дождитесь avatar/session provisioning</li>
          <li>Лимит минут — проверьте тариф на{" "}
            <Link href="/docs/plans" className="text-white underline">/docs/plans</Link>
          </li>
          <li>429 на brain-stream — подождите и повторите</li>
        </ul>
      </section>

      <section
        id="api"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Public API</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>401 — неверный или отозванный ключ</li>
          <li>403 — не хватает scopes или тариф без API (Evaluation/Studio)</li>
          <li>
            Спека:{" "}
            <Link href="/docs/api" className="text-white underline">
              /docs/api
            </Link>
          </li>
        </ul>
      </section>

      <section
        id="missions"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Миссии</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Статус не обновляется — обновите страницу (Inngest async)</li>
          <li>Нужно согласование — Settings → Security → Approvals</li>
          <li>Evaluation: create/missions для catalog ограничены</li>
        </ul>
      </section>

      <section
        id="billing"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Тарифы</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Нет кнопки Create на Evaluation — ожидаемо (catalog only)
          </li>
          <li>
            Checkout — Studio / Team / Scale; Enterprise — Contact sales
          </li>
        </ul>
      </section>
    </article>
  );
}

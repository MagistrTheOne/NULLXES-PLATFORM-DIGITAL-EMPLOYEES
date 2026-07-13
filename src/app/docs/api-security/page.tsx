import Link from "next/link";

export default function DocsApiSecurityPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          API Security
        </h2>
        <p className="mt-4">Контроли для интеграторов Public API.</p>
      </header>

      <section
        id="keys"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Ключи</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Bearer / header auth с nx_live_ ключом</li>
          <li>Least-privilege scopes</li>
          <li>Отзыв немедленный</li>
          <li>
            Подробнее:{" "}
            <Link href="/docs/api-keys" className="text-white underline">
              /docs/api-keys
            </Link>
          </li>
        </ul>
      </section>

      <section
        id="webhooks"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Webhooks</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Только HTTPS endpoints</li>
          <li>HMAC signature verification обязательна</li>
          <li>
            Спека:{" "}
            <Link href="/docs/webhooks" className="text-white underline">
              /docs/webhooks
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}

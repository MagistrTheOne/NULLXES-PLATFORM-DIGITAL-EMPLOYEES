import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/cookies");

export default function DocsCookiesPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">Cookie</h2>
        <p className="mt-4">
          Платформа использует cookies / storage для сессии аутентификации и
          предпочтений интерфейса.
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Обзор</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Session cookie — Better Auth (обязательный для входа)</li>
          <li>Локальные preference flags UI — не для трекинга рекламы</li>
          <li>Сторонние cookies аналитики рекламного профиля не используются</li>
        </ul>
      </section>
    </article>
  );
}

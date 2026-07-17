import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/cookies");

export default function DocsCookiesPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Политика cookies
        </h2>
        <p className="mt-4">
          NULLXES Digital Employees использует cookies и сходные технологии для
          работы платформы, сохранения настроек и (при согласии) обезличенной
          аналитики посещений.
        </p>
      </header>

      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Категории</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <span className="text-white/80">Необходимые</span> — сессия Better
            Auth, язык интерфейса (`NEXT_LOCALE`), фиксация согласия
            (`nx_cookie_consent`). Без них вход и базовая работа сайта
            невозможны или сильно ограничены.
          </li>
          <li>
            <span className="text-white/80">Аналитика</span> — Vercel Analytics
            только после выбора «Принять» в баннере согласия. Рекламный
            трекинг и сторонние cookies профилирования не используются.
          </li>
        </ul>
      </section>

      <section
        id="consent"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Согласие</h3>
        <p className="mt-4">
          При первом визите показывается баннер. Выбор сохраняется в
          first-party cookie <code className="text-white/80">nx_cookie_consent</code>{" "}
          на 12 месяцев: <code className="text-white/80">necessary</code> или{" "}
          <code className="text-white/80">all</code>. Чтобы изменить решение,
          удалите cookie в браузере и обновите страницу — баннер появится
          снова.
        </p>
      </section>

      <section
        id="registry"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Реестр (основные)</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Session cookie Better Auth — аутентификация</li>
          <li>
            <code className="text-white/80">NEXT_LOCALE</code> — язык UI
          </li>
          <li>
            <code className="text-white/80">nx_cookie_consent</code> — выбор по
            cookies
          </li>
        </ul>
      </section>
    </article>
  );
}

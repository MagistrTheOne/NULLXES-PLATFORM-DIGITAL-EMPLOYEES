import Link from "next/link";
import { NULLXES_LEGAL_ENTITY } from "@/shared/legal/nullxes-entity";

export function LandingFooter() {
  const e = NULLXES_LEGAL_ENTITY;

  return (
    <footer className="relative border-t border-white/6 bg-black px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-md">
          <p className="font-(family-name:--font-landing-serif) text-2xl tracking-tight text-white">
            {e.brand}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            {e.fullName}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-white/35">
            {e.address}
          </p>
          <p className="mt-2 font-mono text-[11px] text-white/30">
            ИНН {e.inn} · ОГРН {e.ogrn} · КПП {e.kpp}
          </p>
          <p className="mt-2 text-xs text-white/35">
            {e.directorTitle}: {e.director}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
              Документы
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/55">
              <li>
                <Link href="/docs/offer" className="transition hover:text-white">
                  Публичная оферта
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/personal-data"
                  className="transition hover:text-white"
                >
                  Персональные данные
                </Link>
              </li>
              <li>
                <Link href="/docs/terms" className="transition hover:text-white">
                  Соглашение
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/cookies"
                  className="transition hover:text-white"
                >
                  Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/company"
                  className="transition hover:text-white"
                >
                  Реквизиты
                </Link>
              </li>
              <li>
                <Link href="/docs/plans" className="transition hover:text-white">
                  Тарифы
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
              Контакты
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/55">
              <li>
                <a
                  href={`mailto:${e.email}`}
                  className="transition hover:text-white"
                >
                  {e.email}
                </a>
              </li>
              <li>
                <a
                  href={e.telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  {e.telegram}
                </a>
              </li>
              <li>
                <a
                  href={e.rusprofileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  ЕГРЮЛ / Rusprofile
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-6xl text-[11px] text-white/25">
        © {new Date().getFullYear()} {e.shortName}. Digital Employees.
      </p>
    </footer>
  );
}

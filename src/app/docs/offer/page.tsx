import Link from "next/link";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";

/**
 * Public offer for internet acquiring / bank site requirements.
 * Covers order flow, payment, delivery (digital), refunds, claims.
 */
export default function DocsOfferPage() {
  const e = DOCS_LEGAL_ENTITY;

  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
          Публичная оферта
        </p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-white">
          Договор‑оферта на предоставление доступа к платформе {e.brand}
        </h2>
        <p className="mt-4">
          Настоящий документ является официальным предложением ({e.shortName})
          заключить договор на условиях ниже. Оплата тарифа или регистрация с
          принятием условий означает акцепт оферты (ст. 435, 438 ГК РФ).
        </p>
      </header>

      <section
        id="seller"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Исполнитель</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-white/40">Полное наименование</dt>
            <dd className="mt-1 text-white">{e.fullName}</dd>
          </div>
          <div>
            <dt className="text-white/40">ОГРН</dt>
            <dd className="mt-1 font-mono text-white">{e.ogrn}</dd>
          </div>
          <div>
            <dt className="text-white/40">ИНН / КПП</dt>
            <dd className="mt-1 font-mono text-white">
              {e.inn} / {e.kpp}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-white/40">Юридический адрес</dt>
            <dd className="mt-1 text-white">{e.address}</dd>
          </div>
          <div>
            <dt className="text-white/40">{e.directorTitle}</dt>
            <dd className="mt-1 text-white">{e.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">Контакт</dt>
            <dd className="mt-1">
              <a href={`mailto:${e.email}`} className="text-white underline">
                {e.email}
              </a>
              {" · "}
              <a
                href={e.telegramUrl}
                className="text-white underline"
                target="_blank"
                rel="noreferrer"
              >
                {e.telegram}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section
        id="subject"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Предмет</h3>
        <p className="mt-4">
          Исполнитель предоставляет Заказчику доступ к облачной платформе{" "}
          {e.brand} Digital Employees (создание и эксплуатация цифровых
          сотрудников) по выбранному тарифу. Услуга оказывается дистанционно,
          через сайт{" "}
          <a href={e.siteUrl} className="text-white underline">
            {e.domain}
          </a>
          .
        </p>
      </section>

      <section
        id="prices"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Цены и срок предоставления</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Актуальные цены self-serve тарифов (Evaluation / Studio / Team /
            Scale) публикуются в разделе{" "}
            <Link href="/docs/plans" className="text-white underline">
              Тарифы и лимиты
            </Link>{" "}
            и в настройках Billing платформы (в рублях).
          </li>
          <li>
            Enterprise‑тарифы (Discovery, Pilot, Department, Holding, Flagship)
            — по индивидуальному согласованию.
          </li>
          <li>
            Доступ по оплаченному периоду (месяц или год) открывается после
            подтверждения оплаты. Цифровая услуга оказывается немедленно после
            активации тарифа.
          </li>
        </ul>
      </section>

      <section
        id="order"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Порядок оформления и оплаты</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Зарегистрируйте аккаунт или войдите в workspace.</li>
          <li>
            В Settings → Billing выберите тариф и период (месяц / год).
          </li>
          <li>
            Оплатите через платёжную форму банка (карта, СБП и иные способы,
            доступные терминалу).
          </li>
          <li>
            После успешной оплаты тариф активируется; электронный кассовый чек
            формируется при подключенной онлайн‑кассе (54‑ФЗ).
          </li>
        </ol>
        <p className="mt-4">
          Доставка материального товара не осуществляется — услуга цифровая.
        </p>
      </section>

      <section
        id="refund"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Возврат и претензии</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Запрос на возврат направляйте на{" "}
            <a href={`mailto:${e.email}`} className="text-white underline">
              {e.email}
            </a>{" "}
            с указанием email аккаунта, OrderId / PaymentId и причины.
          </li>
          <li>
            Рассмотрение претензии — до 10 рабочих дней. При полном или частичном
            возврате средства возвращаются тем же способом оплаты через банк.
          </li>
          <li>
            Если доступ по тарифу уже использован существенно (создание
            сотрудников, Talk, API), возврат может быть пропорциональным или
            отклонён — с мотивированным ответом.
          </li>
          <li>
            Споры стороны стремятся урегулировать переговорами; при
            недостижении согласия — по месту нахождения Исполнителя.
          </li>
        </ul>
      </section>

      <section
        id="personal-data"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Персональные данные</h3>
        <p className="mt-4">
          Обработка ПДн — по{" "}
          <Link href="/docs/personal-data" className="text-white underline">
            политике персональных данных (152‑ФЗ)
          </Link>
          . Согласие фиксируется при регистрации.
        </p>
      </section>

      <p className="text-xs text-white/35">
        Реквизиты:{" "}
        <a
          href={e.rusprofileUrl}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Rusprofile
        </a>
        . Также:{" "}
        <Link href="/docs/terms" className="underline">
          пользовательское соглашение
        </Link>
        .
      </p>
    </article>
  );
}

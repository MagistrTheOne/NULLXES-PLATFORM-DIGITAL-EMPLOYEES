import Link from "next/link";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";

export default function DocsPersonalDataPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Персональные данные (152-ФЗ)
        </h2>
        <p className="mt-4">
          Документация по обработке и защите персональных данных формируется в
          соответствии с Федеральным законом №152-ФЗ «О персональных данных»,
          ГОСТ Р ИСО/МЭК 27001-2021 (информационная безопасность) и ГОСТ Р
          7.0.8-2013 (делопроизводство).
        </p>
      </header>

      <section
        id="operator"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Оператор персональных данных</h3>
        <dl className="mt-4 grid gap-3">
          <div>
            <dt className="text-white/40">Полное наименование</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.fullName}</dd>
          </div>
          <div>
            <dt className="text-white/40">ОГРН / ИНН / КПП</dt>
            <dd className="mt-1 font-mono text-white">
              {DOCS_LEGAL_ENTITY.ogrn} / {DOCS_LEGAL_ENTITY.inn} /{" "}
              {DOCS_LEGAL_ENTITY.kpp}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Руководитель</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">Контакт</dt>
            <dd className="mt-1">
              <a href={`mailto:${DOCS_LEGAL_ENTITY.email}`} className="text-white underline">
                {DOCS_LEGAL_ENTITY.email}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section
        id="documents"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Базовый комплект документов</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Приказ о назначении ответственного за обработку и защиту ПДн
          </li>
          <li>
            Приказ об утверждении перечня мест хранения документов и носителей
            ПДн
          </li>
          <li>
            Политика в отношении обработки и защиты ПДн (публикуется на сайте)
          </li>
          <li>Положение о защите персональных данных</li>
          <li>Регламент уничтожения ПДн</li>
          <li>Инструкция по работе со съёмными носителями</li>
          <li>План действий при инцидентах информационной безопасности</li>
          <li>Формы согласий на обработку ПДн</li>
          <li>Журнал учёта обращений субъектов ПДн</li>
          <li>Журнал учёта выдачи ПДн третьим лицам</li>
        </ul>
      </section>

      <section
        id="storage"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Места и условия хранения</h3>
        <p className="mt-3">
          <strong className="text-white">Электронные носители:</strong>{" "}
          персональные данные пользователей платформы хранятся в PostgreSQL
          (Neon) на территории, определяемой конфигурацией развёртывания.
          Доступ — через индивидуальные учётные записи с парольной
          аутентификацией и RBAC.
        </p>
        <p className="mt-3">
          <strong className="text-white">Шифрование:</strong> чувствительные
          поля (webhook secrets, integration tokens, export tokens, API keys
          организации) шифруются at rest (AES-256-GCM). Подробнее —{" "}
          <Link href="/trust" className="text-white underline">
            Trust Center
          </Link>
          .
        </p>
        <p className="mt-3">
          <strong className="text-white">Сроки хранения:</strong> обработка и
          хранение прекращаются при достижении целей обработки, истечении срока
          согласия или отзыве согласия субъектом. Уничтожение — комиссионно, с
          актом об уничтожении персональных данных.
        </p>
      </section>

      <section
        id="rights"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Права субъектов ПДн</h3>
        <p className="mt-3">
          Субъект персональных данных вправе запросить доступ, уточнение,
          блокирование или уничтожение своих данных, а также отозвать согласие на
          обработку. Обращения принимаются на{" "}
          <a href={`mailto:${DOCS_LEGAL_ENTITY.email}`} className="text-white underline">
            {DOCS_LEGAL_ENTITY.email}
          </a>
          .
        </p>
      </section>

      <section className="text-xs text-white/45">
        <p>
          Справочные материалы по комплекту документов 152-ФЗ:{" "}
          <a
            href="https://legal-box.ru/152fz-docs"
            className="text-white/70 underline"
            target="_blank"
            rel="noreferrer"
          >
            legal-box.ru/152fz-docs
          </a>
        </p>
      </section>
    </article>
  );
}

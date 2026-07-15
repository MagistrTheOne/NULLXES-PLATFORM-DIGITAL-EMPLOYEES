import Link from "next/link";
import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";
import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/personal-data");

export default function DocsPersonalDataPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Персональные данные (152-ФЗ)
        </h2>
        <p className="mt-4">
          Документация по обработке и защите персональных данных формируется в
          соответствии с Федеральным законом от 27.07.2006 №152-ФЗ «О
          персональных данных», ГОСТ Р ИСО/МЭК 27001-2021 (системы менеджмента
          информационной безопасности) и ГОСТ Р 7.0.8-2013 (делопроизводство /
          документирование).
        </p>
        <p className="mt-3">
          Настоящий раздел описывает оператора ПДн, состав обрабатываемых
          данных, места и условия хранения, меры защиты, аудит доступа и права
          субъектов. Юридически значимые формы согласий и локальные акты
          оператора применяются дополнительно к публичному описанию.
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
            <dt className="text-white/40">Юридический адрес</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.address}</dd>
          </div>
          <div>
            <dt className="text-white/40">Руководитель</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.director}</dd>
          </div>
          <div>
            <dt className="text-white/40">Контакт по вопросам ПДн</dt>
            <dd className="mt-1">
              <a
                href={`mailto:${DOCS_LEGAL_ENTITY.email}`}
                className="text-white underline"
              >
                {DOCS_LEGAL_ENTITY.email}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section
        id="categories"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Категории обрабатываемых данных</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Учётные данные пользователей workspace: имя, email, роль, сведения
            аутентификации (в т.ч. 2FA при включении)
          </li>
          <li>
            Организационные данные: профиль организации, участники команды,
            приглашения
          </li>
          <li>
            Операционные данные цифровой рабочей силы: профили digital
            employees, сессии Talk/Conversations, задачи, миссии, knowledge
            sources
          </li>
          <li>
            Технические журналы: audit events, IP (при фиксации), метаданные
            API-доступа
          </li>
          <li>
            Платёжные/тарифные сведения в объёме, необходимом для биллинга
            (через провайдера оплаты)
          </li>
        </ul>
        <p className="mt-3">
          Специальные категории ПДн и биометрические данные платформой по
          умолчанию не запрашиваются. Загрузка портретов аватаров относится к
          контенту организации и обрабатывается в рамках целей эксплуатации
          digital employees.
        </p>
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
        <h3 className="font-medium text-white">
          Персональное хранение данных: места и условия
        </h3>
        <p className="mt-3">
          <strong className="text-white">Электронные носители:</strong>{" "}
          персональные и операционные данные пользователей платформы хранятся в
          PostgreSQL (Neon) с изоляцией по организации (organization-scoped
          access). Регион размещения определяется конфигурацией развёртывания;
          для enterprise доступны варианты с учётом требований к локализации.
        </p>
        <p className="mt-3">
          <strong className="text-white">Разграничение доступа:</strong> доступ
          только через индивидуальные учётные записи Better Auth, RBAC ролей
          workspace (owner / admin / operator / viewer), опциональную 2FA для
          администраторов и API-ключи с областями доступа.
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
          <strong className="text-white">Сроки хранения и уничтожение:</strong>{" "}
          обработка и хранение прекращаются при достижении целей обработки,
          истечении срока согласия или отзыве согласия субъектом. Политика
          retention организации управляет сроком хранения сессий; уничтожение —
          комиссионно, с актом об уничтожении персональных данных. Владелец
          workspace может инициировать экспорт и удаление данных организации в
          Settings → Advanced.
        </p>
      </section>

      <section
        id="audit"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Аудит и контроль доступа</h3>
        <p className="mt-3">
          В соответствии с требованиями к учёту действий при обработке ПДн
          платформа ведёт журнал аудита (audit log) по
          security-relevant событиям организации: изменения настроек
          безопасности, операции с API-ключами, экспорт данных, отказ в доступе
          по API, административные действия.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Просмотр и фильтрация: Settings → Security / Audit (для
            авторизованных ролей с правом управления организацией)
          </li>
          <li>
            Состав записи: действие, актор (пользователь/роль), тип ресурса,
            идентификатор ресурса, метаданные, IP (если зафиксирован), время
          </li>
          <li>
            Журнал предназначен для внутреннего контроля оператора и расследования
            инцидентов; это не публичный live-мониторинг Trust Center
          </li>
          <li>
            Дополнительно фиксируются work events цифровой рабочей силы
            (задачи, approvals, handoff) в операционном контуре организации
          </li>
        </ul>
        <p className="mt-3">
          При инциденте информационной безопасности оператор действует по плану
          реагирования из комплекта документов 152-ФЗ и уведомляет субъектов /
          уполномоченный орган в случаях, предусмотренных законом.
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
          обработку (ст. 14, 21 152-ФЗ и связанные нормы). Обращения принимаются
          на{" "}
          <a
            href={`mailto:${DOCS_LEGAL_ENTITY.email}`}
            className="text-white underline"
          >
            {DOCS_LEGAL_ENTITY.email}
          </a>
          . Срок рассмотрения — в пределах, установленных законодательством РФ.
        </p>
      </section>

      <section className="text-xs text-white/45">
        <p>
          Связанные материалы:{" "}
          <Link href="/trust" className="text-white/70 underline">
            Trust Center
          </Link>
          ,{" "}
          <Link href="/docs/terms" className="text-white/70 underline">
            условия использования
          </Link>
          ,{" "}
          <Link href="/docs/assistant" className="text-white/70 underline">
            ассистент документации
          </Link>
          . Справочные материалы по комплекту документов 152-ФЗ:{" "}
          <a
            href="https://legal-box.ru/152fz-docs"
            className="text-white/70 underline"
            target="_blank"
            rel="noreferrer"
          >
            legal-box.ru/152fz-docs
          </a>
          .
        </p>
      </section>
    </article>
  );}

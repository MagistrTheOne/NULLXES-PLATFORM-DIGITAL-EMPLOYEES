import { DOCS_LEGAL_ENTITY } from "../_lib/docs-legal";

export default function DocsTermsPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Пользовательское соглашение
        </h2>
        <p className="mt-4">
          Настоящее соглашение регулирует доступ к платформе{" "}
          {DOCS_LEGAL_ENTITY.brand} Digital Employees и использование её
          функциональности. Регистрируя аккаунт, вы подтверждаете, что
          ознакомились с условиями и принимаете их в полном объёме.
        </p>
      </header>

      <section
        id="operator"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Правообладатель сервиса</h3>
        <dl className="mt-4 grid gap-3">
          <div>
            <dt className="text-white/40">Наименование</dt>
            <dd className="mt-1 text-white">{DOCS_LEGAL_ENTITY.fullName}</dd>
          </div>
          <div>
            <dt className="text-white/40">ОГРН / ИНН</dt>
            <dd className="mt-1 font-mono text-white">
              {DOCS_LEGAL_ENTITY.ogrn} / {DOCS_LEGAL_ENTITY.inn}
            </dd>
          </div>
          <div>
            <dt className="text-white/40">Контакт</dt>
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
        id="scope"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Предмет и доступ</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Платформа предоставляет инструменты для создания, настройки и
            эксплуатации цифровых сотрудников в рабочих пространствах
            организаций.
          </li>
          <li>
            Доступ предоставляется зарегистрированным пользователям в объёме
            роли и тарифных ограничений рабочего пространства.
          </li>
          <li>
            Обработка персональных данных осуществляется отдельно — см.{" "}
            <a href="/docs/personal-data" className="text-white underline">
              политику персональных данных
            </a>
            .
          </li>
        </ul>
      </section>

      <section
        id="obligations"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Обязанности пользователя</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Не передавать учётные данные третьим лицам и обеспечивать
            конфиденциальность пароля.
          </li>
          <li>
            Не использовать сервис для противоправных действий, спама,
            вредоносного кода и обхода технических ограничений.
          </li>
          <li>
            Соблюдать права третьих лиц при загрузке материалов в базу знаний и
            сценарии диалогов.
          </li>
        </ul>
      </section>

      <section
        id="liability"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">Ограничение ответственности</h3>
        <p className="mt-4">
          Сервис предоставляется «как есть». Оператор не несёт ответственности
          за решения, принятые пользователем на основе ответов ИИ-агентов, и за
          перебои сторонних провайдеров (LLM, аватары, почта), при условии
          разумных мер по восстановлению работоспособности.
        </p>
      </section>
    </article>
  );
}

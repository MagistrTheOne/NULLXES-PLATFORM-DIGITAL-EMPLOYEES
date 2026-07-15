import { docsPageMetadata } from "../_lib/docs-page-metadata";

export const metadata = docsPageMetadata("/docs/functional");

export default function DocsFunctionalPage() {
  return (
    <article className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
      <header>
        <h2 className="text-2xl font-medium tracking-tight text-white">
          Описание функциональных характеристик
        </h2>
        <p className="mt-4">
          Программное обеспечение{" "}
          <strong className="font-medium text-white">
            NULLXES Digital Employees
          </strong>{" "}
          — корпоративная платформа для создания, управления и эксплуатации
          цифровых сотрудников в бизнес-процессах организации.
        </p>
      </header>

      <section
        id="purpose"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">1. Назначение платформы</h3>
        <p className="mt-3">
          NULLXES позволяет организациям внедрять цифровых сотрудников для
          работы с клиентскими обращениями, внутренними знаниями, задачами,
          коммуникациями и операционными сценариями. Платформа объединяет
          настройку ролей, контроль действий, аналитику и интеграции в едином
          рабочем контуре.
        </p>
      </section>

      <section
        id="capabilities"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">2. Функциональные возможности</h3>

        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Управление цифровыми сотрудниками</strong>{" "}
            — создание профилей, определение должности, зоны ответственности,
            правил работы, делового тона и сценариев взаимодействия.
          </li>
          <li>
            <strong className="text-white">Диалоги и обработка обращений</strong>{" "}
            — ведение текстовых и голосовых сессий, сохранение истории
            взаимодействий и контроль качества коммуникации.
          </li>
          <li>
            <strong className="text-white">Корпоративные знания</strong> — подключение
            документов и материалов организации для использования сотрудником в
            рамках разрешённого рабочего контекста.
          </li>
          <li>
            <strong className="text-white">Задачи и рабочие процессы</strong> —
            постановка задач цифровым сотрудникам, отслеживание статусов,
            маршрутизация результатов и передача задач ответственным
            специалистам.
          </li>
          <li>
            <strong className="text-white">Контроль и согласование</strong> —
            проверка действий, требующих участия человека, а также управление
            исходящими коммуникациями и правилами исполнения.
          </li>
          <li>
            <strong className="text-white">Операционный центр</strong> — единое
            пространство для мониторинга активности цифровой рабочей силы,
            текущих задач и ключевых событий.
          </li>
          <li>
            <strong className="text-white">Аналитика</strong> — показатели
            использования, активности, диалогов, задач и базы знаний для оценки
            эффективности внедрения.
          </li>
          <li>
            <strong className="text-white">Интеграции</strong> — подключение к
            корпоративным системам и внешним сервисам через API в соответствии с
            политиками организации.
          </li>
        </ul>
      </section>

      <section
        id="governance"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">3. Управление и контроль</h3>
        <p className="mt-3">
          Платформа предоставляет инструменты для управления организациями,
          рабочими пространствами, участниками и правами доступа. Настройки
          цифровых сотрудников, правила обработки данных и сценарии
          взаимодействия контролируются на уровне организации.
        </p>
        <p className="mt-3">
          Для критичных операций может применяться механизм участия человека:
          согласование результата, подтверждение действия или передача задачи
          профильному сотруднику.
        </p>
      </section>

      <section
        id="security"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">4. Безопасность</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Разграничение доступа пользователей в рамках организации.</li>
          <li>Управление ключами доступа и интеграционными подключениями.</li>
          <li>Контроль событий и активности в рабочем пространстве.</li>
          <li>
            Настройка политик доступа и ограничений сетевого взаимодействия.
          </li>
          <li>
            Экспорт данных и управление их хранением в рамках доступной
            конфигурации.
          </li>
        </ul>
      </section>

      <section
        id="deployment"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">5. Варианты внедрения</h3>
        <p className="mt-3">
          NULLXES поддерживает поэтапное внедрение: от оценки одного сценария
          до масштабирования цифровых сотрудников на функции клиентского
          сервиса, продаж, HR, поддержки и внутренних операций.
        </p>
        <p className="mt-3">
          Состав интеграций, требования к безопасности, порядок доступа и
          параметры сопровождения определяются в рамках выбранного
          корпоративного контура. Для генерации и анализа текстов организация
          может подключать различных LLM-провайдеров (в том числе OpenAI,
          Anthropic, Google и платформенный NULLXES brain) через Settings → AI.
        </p>
      </section>

      <section
        id="roles"
        className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#111111] p-6"
      >
        <h3 className="font-medium text-white">6. Роли пользователей</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Администратор</strong> — управляет
            организацией, участниками, политиками доступа, настройками и
            интеграциями.
          </li>
          <li>
            <strong className="text-white">Пользователь</strong> — работает с
            цифровыми сотрудниками, диалогами, задачами и доступными рабочими
            материалами в рамках выданных прав.
          </li>
        </ul>
      </section>
    </article>
  );
}

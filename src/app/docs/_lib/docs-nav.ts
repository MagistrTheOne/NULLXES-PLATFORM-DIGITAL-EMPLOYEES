export type DocsTocItem = { id: string; label: string };

export type DocsNavItem = {
  href: string;
  label: string;
  breadcrumb: string;
  toc: DocsTocItem[];
};

export type DocsNavGroup = {
  label: string;
  items: DocsNavItem[];
};

/** Stripe / GitHub Enterprise style: one topic per page, platform not FAQ. */
export const DOCS_NAV: DocsNavGroup[] = [
  {
    label: "Начало",
    items: [
      {
        href: "/docs",
        label: "Обзор",
        breadcrumb: "Обзор",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "domain", label: "Домен" },
          { id: "sections", label: "Разделы" },
        ],
      },
      {
        href: "/docs/installation",
        label: "Быстрый старт",
        breadcrumb: "Быстрый старт",
        toc: [
          { id: "requirements", label: "Требования" },
          { id: "source", label: "Исходный код" },
          { id: "env", label: "Окружение" },
          { id: "verify", label: "Проверка" },
        ],
      },
      {
        href: "/docs/architecture",
        label: "Архитектура платформы",
        breadcrumb: "Архитектура",
        toc: [
          { id: "stack", label: "Стек" },
          { id: "flow", label: "Поток данных" },
        ],
      },
      {
        href: "/docs/assistant",
        label: "Помощник по документации",
        breadcrumb: "Yuki Nakora",
        toc: [{ id: "assistant", label: "Yuki Nakora" }],
      },
    ],
  },
  {
    label: "Работа с цифровыми сотрудниками",
    items: [
      {
        href: "/docs/employees",
        label: "Цифровые сотрудники",
        breadcrumb: "Цифровые сотрудники",
        toc: [
          { id: "model", label: "Модель" },
          { id: "catalog", label: "Каталог NULLXES" },
          { id: "lifecycle", label: "Жизненный цикл" },
        ],
      },
      {
        href: "/docs/talk",
        label: "Разговоры (Talk)",
        breadcrumb: "Talk",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "start", label: "Сессия" },
          { id: "limits", label: "Лимиты" },
          { id: "ready", label: "Talk Ready" },
        ],
      },
      {
        href: "/docs/knowledge",
        label: "База знаний",
        breadcrumb: "База знаний",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "upload", label: "Загрузка" },
          { id: "limits", label: "Лимиты" },
        ],
      },
      {
        href: "/docs/missions",
        label: "Миссии",
        breadcrumb: "Миссии",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "runtime", label: "Запуск" },
        ],
      },
    ],
  },
  {
    label: "Платформа",
    items: [
      {
        href: "/docs/workspaces",
        label: "Рабочие пространства",
        breadcrumb: "Рабочие пространства",
        toc: [{ id: "overview", label: "Обзор" }],
      },
      {
        href: "/docs/organizations",
        label: "Организации",
        breadcrumb: "Организации",
        toc: [
          { id: "model", label: "Модель" },
          { id: "isolation", label: "Изоляция" },
        ],
      },
      {
        href: "/docs/roles",
        label: "Пользователи и роли",
        breadcrumb: "Роли",
        toc: [
          { id: "roles", label: "Роли" },
          { id: "matrix", label: "Матрица прав" },
        ],
      },
      {
        href: "/docs/api",
        label: "API",
        breadcrumb: "API",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "auth", label: "Аутентификация" },
          { id: "endpoints", label: "Эндпоинты" },
          { id: "responses", label: "Ответы" },
        ],
      },
      {
        href: "/docs/api-keys",
        label: "API Keys",
        breadcrumb: "API Keys",
        toc: [
          { id: "create", label: "Создание" },
          { id: "scopes", label: "Scopes" },
          { id: "revoke", label: "Отзыв" },
        ],
      },
      {
        href: "/docs/webhooks",
        label: "Webhooks",
        breadcrumb: "Webhooks",
        toc: [
          { id: "events", label: "События" },
          { id: "signing", label: "Подпись" },
          { id: "setup", label: "Настройка" },
        ],
      },
      {
        href: "/docs/integrations",
        label: "Интеграции",
        breadcrumb: "Интеграции",
        toc: [{ id: "overview", label: "Обзор" }],
      },
    ],
  },
  {
    label: "Администрирование",
    items: [
      {
        href: "/docs/plans",
        label: "Тарифы",
        breadcrumb: "Тарифы",
        toc: [
          { id: "matrix", label: "Матрица" },
          { id: "api", label: "API по тарифам" },
        ],
      },
      {
        href: "/docs/limits",
        label: "Лимиты платформы",
        breadcrumb: "Лимиты",
        toc: [
          { id: "workforce", label: "Workforce" },
          { id: "talk", label: "Talk" },
          { id: "knowledge", label: "Knowledge" },
          { id: "api", label: "API" },
        ],
      },
      {
        href: "/docs/analytics",
        label: "Аналитика",
        breadcrumb: "Аналитика",
        toc: [{ id: "overview", label: "Обзор" }],
      },
      {
        href: "/docs/audit",
        label: "Аудит действий",
        breadcrumb: "Аудит",
        toc: [{ id: "overview", label: "Обзор" }],
      },
    ],
  },
  {
    label: "Безопасность",
    items: [
      {
        href: "/docs/security",
        label: "Безопасность платформы",
        breadcrumb: "Безопасность",
        toc: [
          { id: "transport", label: "Транспорт" },
          { id: "access", label: "Доступ" },
          { id: "controls", label: "Контроли" },
        ],
      },
      {
        href: "/docs/personal-data",
        label: "Персональные данные",
        breadcrumb: "Персональные данные",
        toc: [
          { id: "operator", label: "Оператор" },
          { id: "categories", label: "Категории" },
          { id: "rights", label: "Права субъектов" },
        ],
      },
      {
        href: "/docs/data-storage",
        label: "Хранение данных",
        breadcrumb: "Хранение данных",
        toc: [
          { id: "where", label: "Где хранятся" },
          { id: "retention", label: "Удаление и экспорт" },
        ],
      },
      {
        href: "/docs/api-security",
        label: "API Security",
        breadcrumb: "API Security",
        toc: [
          { id: "keys", label: "Ключи" },
          { id: "webhooks", label: "Webhooks" },
        ],
      },
      {
        href: "/docs/access-control",
        label: "Управление доступом",
        breadcrumb: "Управление доступом",
        toc: [
          { id: "rbac", label: "RBAC" },
          { id: "isolation", label: "Изоляция org" },
        ],
      },
    ],
  },
  {
    label: "Правовые документы",
    items: [
      {
        href: "/docs/terms",
        label: "Пользовательское соглашение",
        breadcrumb: "Пользовательское соглашение",
        toc: [{ id: "scope", label: "Предмет" }],
      },
      {
        href: "/docs/offer",
        label: "Публичная оферта",
        breadcrumb: "Публичная оферта",
        toc: [{ id: "subject", label: "Предмет" }],
      },
      {
        href: "/docs/personal-data",
        label: "Политика обработки ПДн",
        breadcrumb: "Политика обработки ПДн",
        toc: [{ id: "documents", label: "Документы" }],
      },
      {
        href: "/docs/privacy",
        label: "Политика конфиденциальности",
        breadcrumb: "Конфиденциальность",
        toc: [{ id: "overview", label: "Обзор" }],
      },
      {
        href: "/docs/cookies",
        label: "Cookie",
        breadcrumb: "Cookie",
        toc: [{ id: "overview", label: "Обзор" }],
      },
      {
        href: "/docs/company",
        label: "Реквизиты",
        breadcrumb: "Реквизиты",
        toc: [{ id: "requisites", label: "Реквизиты" }],
      },
    ],
  },
  {
    label: "Для разработчиков",
    items: [
      {
        href: "/docs/api",
        label: "Public API",
        breadcrumb: "Public API",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "auth", label: "Authentication" },
          { id: "endpoints", label: "Endpoints" },
          { id: "responses", label: "Errors & format" },
        ],
      },
      {
        href: "/docs/webhooks",
        label: "Webhooks",
        breadcrumb: "Webhooks",
        toc: [
          { id: "events", label: "Events" },
          { id: "signing", label: "Signing" },
        ],
      },
      {
        href: "/docs/changelog",
        label: "Changelog",
        breadcrumb: "Changelog",
        toc: [{ id: "recent", label: "Недавние" }],
      },
    ],
  },
  {
    label: "Enterprise",
    items: [
      {
        href: "/docs/enterprise",
        label: "Enterprise",
        breadcrumb: "Enterprise",
        toc: [
          { id: "deployment", label: "Deployment" },
          { id: "identity", label: "Identity" },
          { id: "compliance", label: "Compliance" },
        ],
      },
    ],
  },
];

export const DOCS_NAV_FLAT: DocsNavItem[] = DOCS_NAV.flatMap(
  (group) => group.items,
);

export function findDocsNavItem(pathname: string): DocsNavItem | undefined {
  // Prefer first match; legal group may share href with security personal-data.
  return DOCS_NAV_FLAT.find((item) => item.href === pathname);
}

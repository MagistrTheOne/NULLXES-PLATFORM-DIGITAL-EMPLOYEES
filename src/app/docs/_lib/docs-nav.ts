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

/** Diátaxis-inspired IA: start · guides · reference · compliance · help */
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
          { id: "domain", label: "Принадлежность домена" },
          { id: "legal", label: "Реквизиты правообладателя" },
          { id: "llm", label: "Обработка текстовых данных" },
          { id: "sections", label: "Разделы документации" },
        ],
      },
      {
        href: "/docs/installation",
        label: "Установка",
        breadcrumb: "Установка",
        toc: [
          { id: "requirements", label: "Системные требования" },
          { id: "source", label: "Исходный код" },
          { id: "contacts", label: "Контакты разработчика" },
          { id: "env", label: "Переменные окружения" },
          { id: "migrations", label: "Миграции БД" },
          { id: "inngest", label: "Регистрация Inngest" },
          { id: "verify", label: "Проверка установки" },
        ],
      },
      {
        href: "/docs/assistant",
        label: "Ассистент (GPT-4o)",
        breadcrumb: "Ассистент документации",
        toc: [
          { id: "assistant", label: "LLM-ассистент" },
          { id: "contacts", label: "Контакты" },
        ],
      },
    ],
  },
  {
    label: "Руководства",
    items: [
      {
        href: "/docs/operation",
        label: "Эксплуатация",
        breadcrumb: "Эксплуатация",
        toc: [
          { id: "login", label: "Вход в систему" },
          { id: "create", label: "Создание сотрудника" },
          { id: "talk", label: "Диалог (Talk)" },
          { id: "missions", label: "Mission Control" },
          { id: "settings", label: "Настройки" },
          { id: "api", label: "Public API" },
          { id: "monitoring", label: "Мониторинг" },
        ],
      },
      {
        href: "/docs/talk",
        label: "Talk",
        breadcrumb: "Talk",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "start", label: "Как начать" },
          { id: "limits", label: "Лимиты" },
          { id: "ready", label: "Talk Ready" },
        ],
      },
      {
        href: "/docs/knowledge",
        label: "Knowledge",
        breadcrumb: "Knowledge",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "upload", label: "Загрузка" },
          { id: "limits", label: "Лимиты chunks" },
        ],
      },
      {
        href: "/docs/troubleshooting",
        label: "Устранение неполадок",
        breadcrumb: "Устранение неполадок",
        toc: [
          { id: "talk", label: "Talk" },
          { id: "api", label: "API" },
          { id: "missions", label: "Миссии" },
          { id: "billing", label: "Тарифы" },
        ],
      },
    ],
  },
  {
    label: "Справочник",
    items: [
      {
        href: "/docs/functional",
        label: "Функциональные характеристики",
        breadcrumb: "Функциональные характеристики",
        toc: [
          { id: "purpose", label: "Назначение" },
          { id: "capabilities", label: "Возможности" },
          { id: "governance", label: "Управление" },
          { id: "security", label: "Безопасность" },
          { id: "deployment", label: "Внедрение" },
          { id: "roles", label: "Роли" },
        ],
      },
      {
        href: "/docs/plans",
        label: "Тарифы и лимиты",
        breadcrumb: "Тарифы и лимиты",
        toc: [
          { id: "matrix", label: "Матрица тарифов" },
          { id: "api", label: "Доступ к API" },
          { id: "names", label: "Имена планов" },
        ],
      },
      {
        href: "/docs/api",
        label: "Public API",
        breadcrumb: "Public API",
        toc: [
          { id: "overview", label: "Обзор" },
          { id: "auth", label: "Ключи и scopes" },
          { id: "endpoints", label: "Эндпоинты" },
          { id: "responses", label: "Формат ответа" },
          { id: "examples", label: "Примеры" },
          { id: "sdk", label: "Typed SDK" },
          { id: "security", label: "Безопасность" },
        ],
      },
      {
        href: "/docs/changelog",
        label: "Changelog",
        breadcrumb: "Changelog",
        toc: [{ id: "recent", label: "Недавние изменения" }],
      },
    ],
  },
  {
    label: "Соответствие",
    items: [
      {
        href: "/docs/personal-data",
        label: "Персональные данные",
        breadcrumb: "Персональные данные",
        toc: [
          { id: "operator", label: "Оператор ПДн" },
          { id: "categories", label: "Категории данных" },
          { id: "documents", label: "Комплект документов" },
          { id: "storage", label: "Хранение" },
          { id: "audit", label: "Аудит" },
          { id: "rights", label: "Права субъектов" },
        ],
      },
      {
        href: "/docs/terms",
        label: "Пользовательское соглашение",
        breadcrumb: "Пользовательское соглашение",
        toc: [
          { id: "operator", label: "Правообладатель" },
          { id: "scope", label: "Предмет и доступ" },
          { id: "obligations", label: "Обязанности" },
          { id: "liability", label: "Ответственность" },
        ],
      },
      {
        href: "/docs/offer",
        label: "Публичная оферта",
        breadcrumb: "Публичная оферта",
        toc: [
          { id: "seller", label: "Исполнитель" },
          { id: "subject", label: "Предмет" },
          { id: "prices", label: "Цены и срок" },
          { id: "order", label: "Оформление и оплата" },
          { id: "refund", label: "Возврат и претензии" },
          { id: "personal-data", label: "Персональные данные" },
        ],
      },
      {
        href: "/docs/company",
        label: "Реквизиты",
        breadcrumb: "Реквизиты",
        toc: [
          { id: "requisites", label: "Юридические реквизиты" },
          { id: "contacts", label: "Контакты" },
        ],
      },
    ],
  },
];

export const DOCS_NAV_FLAT: DocsNavItem[] = DOCS_NAV.flatMap(
  (group) => group.items,
);

export function findDocsNavItem(pathname: string): DocsNavItem | undefined {
  return DOCS_NAV_FLAT.find((item) => item.href === pathname);
}

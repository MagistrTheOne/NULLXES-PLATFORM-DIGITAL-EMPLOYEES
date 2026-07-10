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

export const DOCS_NAV: DocsNavGroup[] = [
  {
    label: "Введение",
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
        href: "/docs/assistant",
        label: "Ассистент документации",
        breadcrumb: "Ассистент документации",
        toc: [
          { id: "assistant", label: "LLM-ассистент" },
          { id: "contacts", label: "Контакты" },
        ],
      },
    ],
  },
  {
    label: "Платформа",
    items: [
      {
        href: "/docs/functional",
        label: "Функциональные характеристики",
        breadcrumb: "Функциональные характеристики",
        toc: [
          { id: "purpose", label: "Назначение" },
          { id: "modules", label: "Состав модулей" },
          { id: "nlp", label: "Обработка языка" },
          { id: "stack", label: "Технологический стек" },
          { id: "roles", label: "Роли пользователей" },
        ],
      },
    ],
  },
  {
    label: "Установка",
    items: [
      {
        href: "/docs/installation",
        label: "Установка и настройка",
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
    ],
  },
  {
    label: "Эксплуатация",
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
    ],
  },
];

export const DOCS_NAV_FLAT: DocsNavItem[] = DOCS_NAV.flatMap(
  (group) => group.items,
);

export function findDocsNavItem(pathname: string): DocsNavItem | undefined {
  return DOCS_NAV_FLAT.find((item) => item.href === pathname);
}

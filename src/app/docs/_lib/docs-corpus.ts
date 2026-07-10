/**
 * Authoritative documentation corpus for the docs assistant (RAG) and llms.txt.
 * Keep in sync when adding /docs pages.
 */

export type DocsCorpusChunk = {
  id: string;
  href: string;
  title: string;
  keywords: string[];
  body: string;
};

export const DOCS_CORPUS: DocsCorpusChunk[] = [
  {
    id: "overview",
    href: "/docs",
    title: "Обзор документации",
    keywords: ["обзор", "платформа", "nullxes", "документация", "домен"],
    body: `NULLXES Digital Employees — Digital Workforce Operating System на nullxesdai.online.
Правообладатель: ООО «НУЛЛЕКСЕС» (ОГРН 1262300017209, ИНН 2311391270).
Документация: https://www.nullxesdai.online/docs
Для миссий и парсинга используется OpenAI GPT через официальный API.`,
  },
  {
    id: "plans",
    href: "/docs/plans",
    title: "Тарифы и лимиты",
    keywords: [
      "тариф",
      "план",
      "billing",
      "evaluation",
      "studio",
      "team",
      "scale",
      "enterprise",
      "лимит",
      "api",
    ],
    body: `Тарифы (id → имя):
- free → Evaluation ($0): каталог NULLXES beta read-only, без create; Talk 2 мин/сессия, 30 мин/мес; API none; seats 1
- studio → Studio ($49/mo): 1 employee, Talk 10 мин, 180 мин/мес, 1 custom avatar, API none
- operator → Team ($200/mo): 3 employees, Talk 20 мин, 600 мин/мес, API read
- scale → Scale ($600/mo): 10 employees, Talk 30 мин, 2000 мин/мес, API full
- enterprise → Enterprise (Contact sales): unlimited employees/Talk, API full, SSO/SLA
- government → Government (Contact sales): residency, 152-FZ controls
Evaluation/Studio не создают API keys. Team = read API. Scale+ = full API.`,
  },
  {
    id: "api",
    href: "/docs/api",
    title: "Public API v1",
    keywords: ["api", "openapi", "nx_live", "scopes", "ключ", "rest", "orval"],
    body: `Base: /api/v1. Auth: Authorization: Bearer nx_live_…
Scopes: employees:read/write, sessions:read, tasks:write.
Bundles: Read-only, Workforce Operator, Admin Integration.
OpenAPI YAML: GET /api/docs. Human docs: /docs/api.
Endpoints: GET/POST /employees, GET/PATCH/DELETE /employees/{id},
POST /employees/{id}/tasks, GET /sessions, GET /sessions/{id}, POST /workforce/assign.
Typed SDK: npm run api:generate (Orval). Keys: Settings → Security.`,
  },
  {
    id: "talk",
    href: "/docs/talk",
    title: "Talk — диалог с сотрудником",
    keywords: ["talk", "диалог", "голос", "anam", "сессия", "brain-stream"],
    body: `Talk: карточка сотрудника → Talk. Текст и голос.
Cognition: POST /api/talk/brain-stream (платформа), Anam — avatar-only.
Лимиты сессии и минут — по тарифу (/docs/plans).
История: /dashboard/conversations.
Статус Talk Ready: avatar + session provisioning ready.`,
  },
  {
    id: "knowledge",
    href: "/docs/knowledge",
    title: "Knowledge и RAG",
    keywords: ["knowledge", "знания", "rag", "chunks", "загрузка", "embedding"],
    body: `Knowledge sources привязаны к digital employee.
Загрузка URL/файлов в Studio / карточке сотрудника.
Индексация фоном (Inngest). Лимит chunks — по тарифу.
Talk использует retrieval при ответах.`,
  },
  {
    id: "operation",
    href: "/docs/operation",
    title: "Эксплуатация",
    keywords: ["вход", "login", "сотрудник", "миссия", "settings", "эксплуатация"],
    body: `Вход: /login или /register → /dashboard.
Создание сотрудника: Digital Employees → New (недоступно на Evaluation).
Миссии: /dashboard/missions/new → Assign mission; статус в Timeline; Approvals в Settings → Security.
Settings: General, Team, AI, Security (2FA, API keys), Advanced (export).`,
  },
  {
    id: "missions",
    href: "/docs/operation#missions",
    title: "Mission Control",
    keywords: ["миссия", "mission", "prospecting", "yuki", "inngest"],
    body: `Missions → Assign mission → сотрудник → Prospecting или Custom → brief → Assign.
Обработка через Inngest. Обновляйте страницу миссии для статуса.
Согласования: Settings → Security → Approvals.`,
  },
  {
    id: "install",
    href: "/docs/installation",
    title: "Установка",
    keywords: ["установка", "env", "migrate", "neon", "vercel", "inngest"],
    body: `Node.js 20+, Neon PostgreSQL, Next.js host, Inngest.
Ключевые env: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, OPENAI_API_KEY,
INNGEST_*, DATA_ENCRYPTION_KEY, API_KEY_PEPPER.
npm run db:migrate; npm run inngest:sync.
Репозиторий: github.com/MagistrTheOne/NULLXES-PLATFORM-DIGITAL-EMPLOYEES`,
  },
  {
    id: "pdn",
    href: "/docs/personal-data",
    title: "Персональные данные (152-ФЗ)",
    keywords: ["152", "пдн", "персональные", "хранение", "аудит", "права"],
    body: `Оператор ПДн: ООО «НУЛЛЕКСЕС». Хранение organization-scoped Neon PostgreSQL.
Шифрование AES-256-GCM для чувствительных полей. Аудит: Settings → Security/Audit.
Права субъектов: ceo@nullxes.com. Trust Center: /trust.`,
  },
  {
    id: "roles",
    href: "/docs/functional#roles",
    title: "Роли",
    keywords: ["роль", "owner", "admin", "member", "права"],
    body: `Owner / Administrator — полное управление организацией, ключами, approvals.
Member — работа с сотрудниками, миссиями и Talk в рамках выданных прав.
Не путать с тарифами Evaluation/Studio/Team/Scale.`,
  },
  {
    id: "troubleshooting",
    href: "/docs/troubleshooting",
    title: "Устранение неполадок",
    keywords: ["ошибка", "не работает", "talk", "provisioning", "429", "ключ"],
    body: `Talk не стартует: проверьте Talk Ready (avatar+session), лимиты минут тарифа.
API 401/403: ключ, scopes, тариф (Evaluation/Studio без API).
Provisioning failed: Settings → AI keys, повторный provision.
Brain-stream 429: rate limit — подождите.
Миссии «зависли»: Inngest dashboard, обновите страницу миссии.`,
  },
  {
    id: "support",
    href: "/docs/assistant",
    title: "Поддержка",
    keywords: ["поддержка", "контакт", "email", "telegram", "yuki"],
    body: `Ассистент документации: Yuki Nakora на /docs/assistant (OpenAI GPT-4o + корпус /docs).
Контакты: ceo@nullxes.com, Telegram @MagistrTheOne.
Руководитель: Онюшко Максим Олегович (Maxim Onyushko).`,
  },
];

export function retrieveDocsContext(
  question: string,
  limit = 5,
): DocsCorpusChunk[] {
  const tokens = question
    .toLowerCase()
    .split(/[^a-zа-яё0-9/+_-]+/i)
    .filter((token) => token.length > 1);

  if (tokens.length === 0) {
    return DOCS_CORPUS.slice(0, limit);
  }

  const scored = DOCS_CORPUS.map((chunk) => {
    const haystack = `${chunk.title} ${chunk.keywords.join(" ")} ${chunk.body}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (chunk.keywords.some((keyword) => keyword.includes(token) || token.includes(keyword))) {
        score += 3;
      }
      if (haystack.includes(token)) {
        score += 1;
      }
    }
    return { chunk, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return DOCS_CORPUS.filter((chunk) =>
      ["overview", "plans", "api", "support"].includes(chunk.id),
    ).slice(0, limit);
  }

  return scored.slice(0, limit).map((row) => row.chunk);
}

export function formatDocsContextForPrompt(chunks: DocsCorpusChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.title} (${chunk.href})\n${chunk.body}`,
    )
    .join("\n\n");
}

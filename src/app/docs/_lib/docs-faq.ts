export type DocsFaqEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

export const DOCS_FAQ: DocsFaqEntry[] = [
  {
    id: "overview",
    question: "Что такое NULLXES Digital Employees?",
    answer:
      "NULLXES Digital Employees — платформа управления цифровой рабочей силой: digital employees, Talk, миссии, аналитика и Public API. Документация: /docs. Помощник: /docs/assistant (Yuki Nakora).",
    keywords: ["что такое", "обзор", "платформа", "назначение"],
  },
  {
    id: "domain",
    question: "Кому принадлежит домен nullxesdai.online?",
    answer:
      'Домен nullxesdai.online используется правообладателем ООО "НУЛЛЕКСЕС" (ИНН 2311391270, ОГРН 1262300017209). Документация: https://www.nullxesdai.online/docs',
    keywords: ["домен", "правообладатель", "nullxesdai"],
  },
  {
    id: "source",
    question: "Где получить исходный код?",
    answer:
      "Публичный репозиторий: https://github.com/MagistrTheOne/NULLXES-PLATFORM-DIGITAL-EMPLOYEES.git\n\ngit clone https://github.com/MagistrTheOne/NULLXES-PLATFORM-DIGITAL-EMPLOYEES.git\ncd NULLXES-PLATFORM-DIGITAL-EMPLOYEES\nnpm install",
    keywords: ["исходный", "git", "clone", "репозиторий", "github"],
  },
  {
    id: "install",
    question: "Какие требования для установки?",
    answer:
      "Node.js 20+, PostgreSQL 15+ (Neon), хостинг Next.js, Inngest, OPENAI_API_KEY, BETTER_AUTH_SECRET, DATABASE_URL. Подробности — /docs/installation.",
    keywords: ["установка", "требования", "node", "postgres", "env"],
  },
  {
    id: "plans",
    question: "Какие тарифы и лимиты?",
    answer:
      "Evaluation (free), Studio, Team (operator), Scale, Enterprise, Government. Матрица лимитов: /docs/plans. Evaluation — catalog only без create; API с Team (read) и Scale+ (full).",
    keywords: ["тариф", "план", "лимит", "evaluation", "studio", "billing"],
  },
  {
    id: "llm",
    question: "Какой LLM используется?",
    answer:
      "Когниция Talk и миссий идёт через настроенный LLM provider организации (Settings → AI). Помощник документации: Yuki Nakora (/docs/assistant) по корпусу /docs.",
    keywords: ["gpt", "openai", "llm", "ассистент", "yuki"],
  },
  {
    id: "missions",
    question: "Как создать миссию?",
    answer:
      "Missions → Assign mission → выберите digital employee → Prospecting или Custom → brief → Assign mission. Статус в Mission Control. Approvals: Settings → Security.",
    keywords: ["миссия", "mission", "prospecting", "yuki"],
  },
  {
    id: "api",
    question: "Как пользоваться Public API?",
    answer:
      "Base /api/v1, Authorization: Bearer nx_live_…. Ключи — Settings → Security. Документация: /docs/api. OpenAPI: GET /api/docs. Evaluation/Studio без API; Team — read; Scale+ — full.",
    keywords: ["api", "openapi", "ключ", "nx_live", "интеграц", "rest", "scopes"],
  },
  {
    id: "talk",
    question: "Как работает Talk?",
    answer:
      "Карточка сотрудника → Talk. Нужен статус Talk Ready. Лимиты минут — по тарифу (/docs/plans). Подробнее: /docs/talk.",
    keywords: ["talk", "диалог", "голос", "сессия"],
  },
  {
    id: "support",
    question: "Как связаться с поддержкой?",
    answer:
      "Помощник: /docs/assistant (Yuki Nakora).\nEmail: ceo@nullxes.com\nTelegram: @MagistrTheOne\nРуководитель: Онюшко Максим Олегович (Maxim Onyushko).",
    keywords: ["поддержка", "контакт", "email", "telegram", "ceo"],
  },
  {
    id: "pdn",
    question: "Где документация по персональным данным (152-ФЗ)?",
    answer:
      "Раздел /docs/personal-data: оператор ПДн, категории, хранение, шифрование, аудит, права субъектов. Trust Center: /trust.",
    keywords: ["пдн", "152", "персональные", "fz", "гост", "аудит", "хранение"],
  },
];

export function findFaqAnswer(input: string): DocsFaqEntry | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const direct = DOCS_FAQ.find(
    (entry) =>
      entry.question.toLowerCase().includes(normalized) ||
      normalized.includes(entry.id),
  );
  if (direct) {
    return direct;
  }

  let best: DocsFaqEntry | null = null;
  let bestScore = 0;
  for (const entry of DOCS_FAQ) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore > 0 ? best : null;
}

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
      "NULLXES Digital Employees — платформа управления цифровой рабочей силой: создание digital employees, диалоги, миссии, аналитика и API. Документация размещена на nullxesdai.online/docs.",
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
      "Node.js 20+, PostgreSQL 15+ (Neon), хостинг Next.js, Inngest, OPENAI_API_KEY, BETTER_AUTH_SECRET, DATABASE_URL. Подробности — раздел «Установка и настройка» в документации.",
    keywords: ["установка", "требования", "node", "postgres", "env"],
  },
  {
    id: "llm",
    question: "Какой LLM используется для миссий и парсинга?",
    answer:
      "Для анализа и структурирования текстов в Mission Control используется исключительно OpenAI GPT через официальный API. Организация может указать свой ключ OpenAI в Settings → AI.",
    keywords: ["gpt", "openai", "llm", "миссии", "парсинг"],
  },
  {
    id: "missions",
    question: "Как создать миссию?",
    answer:
      "Missions → Assign mission → выберите digital employee → тип Prospecting или Custom → заполните brief → Assign mission. Статус отслеживается в Mission Control.",
    keywords: ["миссия", "mission", "prospecting", "yuki"],
  },
  {
    id: "api",
    question: "Как пользоваться Public API?",
    answer:
      "Public API v1: base /api/v1, Authorization: Bearer nx_live_…. Ключи — Settings → Security (scopes: employees:read/write, sessions:read, tasks:write). Документация: /docs/api. OpenAPI YAML: GET /api/docs. Тариф: Evaluation/Studio без API; Operator — чтение; Scale+ — полный доступ.",
    keywords: ["api", "openapi", "ключ", "nx_live", "интеграц", "rest", "scopes"],
  },
  {
    id: "support",
    question: "Как связаться с поддержкой?",
    answer:
      "Email: ceo@nullxes.com\nTelegram: @MagistrTheOne\nРуководитель: Онюшко Максим Олегович (Maxim Onyushko), ООО «НУЛЛЕКСЕС».",
    keywords: ["поддержка", "контакт", "email", "telegram", "ceo"],
  },
  {
    id: "pdn",
    question: "Где документация по персональным данным (152-ФЗ)?",
    answer:
      "Раздел «Персональные данные» (/docs/personal-data): оператор ПДн, категории данных, места и условия хранения, шифрование, сроки/уничтожение, аудит доступа (Settings → Audit), права субъектов. Trust Center (/trust) — статичное описание мер безопасности. Документы формируются по ФЗ №152-ФЗ, ГОСТ Р ИСО/МЭК 27001-2021 и ГОСТ Р 7.0.8-2013.",
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
    const score = entry.keywords.reduce((total, keyword) => {
      return normalized.includes(keyword) ? total + 1 : total;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore > 0 ? best : null;
}

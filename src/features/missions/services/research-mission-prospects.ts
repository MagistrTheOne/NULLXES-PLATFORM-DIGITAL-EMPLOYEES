import { searchWebOpenAi } from "@/features/agent-tools/services/search-web-openai";
import {
  detectMissionLanguage,
  missionLanguageLabel,
} from "@/features/missions/lib/detect-mission-language";

export async function researchMissionProspects(input: {
  missionContext: string;
  brief: string;
  goal?: string | null;
  ruQualification?: boolean;
}): Promise<string> {
  const language = detectMissionLanguage(input.brief, input.goal, input.missionContext);
  const languageLabel = missionLanguageLabel(language);
  const ruMode = input.ruQualification === true;

  const companyQuery = ruMode
    ? `${input.missionContext}\n\nНайди 10–15 российских B2B компаний (enterprise). Для каждой: название, домен, сектор/ОКВЭД, год основания или стаж на рынке, выручка (если есть в открытых источниках), признаки РФ (адрес, ИНН, .ru), ссылки на источники.`
    : language === "ru"
      ? `${input.missionContext}\n\nНайди 10–15 enterprise B2B компаний с бюджетом на цифровую трансформацию и операционные команды. Укажи название, домен, сигналы бюджета и ссылки на источники.`
      : `${input.missionContext}\n\nFind 10–15 enterprise B2B companies with budget for digital transformation and large operational teams. Include company name, domain, budget signals, and source URLs.`;

  const contactQuery = ruMode
    ? `${input.missionContext}\n\nДля российских B2B компаний найди реальные контакты ЛПР: ФИО, должность, опубликованный email и URL источника. Email только если дословно в источнике. Без контакта — не включай компанию.`
    : language === "ru"
      ? `${input.missionContext}\n\nНайди реальные B2B контакты decision-maker: имя, должность, опубликованный email и URL источника (LinkedIn, пресс-релиз, страница спикера, корпоративный сайт). Запрещено угадывать email. Включай только email, которые дословно встречаются в источнике.`
      : `${input.missionContext}\n\nFind real B2B decision-maker contacts: full name, title, published email, and source URL (LinkedIn, press release, speaker page, corporate site). Never guess emails. Only include emails that appear verbatim in the source.`;

  const revenueQuery = ruMode
    ? `${input.missionContext}\n\nНайди данные о выручке российских компаний из рейтингов, отчётности, Forbes/РБК/СПАРК/Контур (что доступно в web). Только цифры с URL источника.`
    : null;

  const searches = await Promise.all([
    searchWebOpenAi(companyQuery),
    searchWebOpenAi(contactQuery),
    revenueQuery ? searchWebOpenAi(revenueQuery) : Promise.resolve(""),
  ]);

  const [companyResults, contactResults, revenueResults] = searches;

  const sections = [
    `Mission language: ${languageLabel}`,
    ruMode ? "Qualification mode: RU market (strict)" : null,
    "",
    "=== Company research ===",
    companyResults,
    "",
    "=== Contact research ===",
    contactResults,
  ];

  if (ruMode && revenueResults.trim()) {
    sections.push("", "=== Revenue research ===", revenueResults);
  }

  return sections.filter((part) => part !== null).join("\n");
}

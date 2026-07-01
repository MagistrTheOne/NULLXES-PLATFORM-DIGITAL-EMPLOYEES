import { searchWebOpenAi } from "@/features/agent-tools/services/search-web-openai";
import {
  detectMissionLanguage,
  missionLanguageLabel,
} from "@/features/missions/lib/detect-mission-language";

export async function researchMissionProspects(input: {
  missionContext: string;
  brief: string;
  goal?: string | null;
}): Promise<string> {
  const language = detectMissionLanguage(input.brief, input.goal, input.missionContext);
  const languageLabel = missionLanguageLabel(language);

  const companyQuery =
    language === "ru"
      ? `${input.missionContext}\n\nНайди 10–15 enterprise B2B компаний с бюджетом на цифровую трансформацию и операционные команды. Укажи название, домен, сигналы бюджета и ссылки на источники.`
      : `${input.missionContext}\n\nFind 10–15 enterprise B2B companies with budget for digital transformation and large operational teams. Include company name, domain, budget signals, and source URLs.`;

  const contactQuery =
    language === "ru"
      ? `${input.missionContext}\n\nНайди реальные B2B контакты decision-maker: имя, должность, опубликованный email и URL источника (LinkedIn, пресс-релиз, страница спикера, корпоративный сайт). Запрещено угадывать email. Включай только email, которые дословно встречаются в источнике.`
      : `${input.missionContext}\n\nFind real B2B decision-maker contacts: full name, title, published email, and source URL (LinkedIn, press release, speaker page, corporate site). Never guess emails. Only include emails that appear verbatim in the source.`;

  const [companyResults, contactResults] = await Promise.all([
    searchWebOpenAi(companyQuery),
    searchWebOpenAi(contactQuery),
  ]);

  return [
    `Mission language: ${languageLabel}`,
    "",
    "=== Company research ===",
    companyResults,
    "",
    "=== Contact research ===",
    contactResults,
  ].join("\n");
}

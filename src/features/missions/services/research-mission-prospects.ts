import { searchWebOpenAi } from "@/features/agent-tools/services/search-web-openai";
import {
  detectMissionLanguage,
  missionLanguageLabel,
} from "@/features/missions/lib/detect-mission-language";
import type { MissionQualificationProfile } from "@/features/missions/lib/resolve-mission-qualification-profile";

export async function researchMissionProspects(input: {
  missionContext: string;
  brief: string;
  goal?: string | null;
  profile?: MissionQualificationProfile;
}): Promise<string> {
  const language = detectMissionLanguage(input.brief, input.goal, input.missionContext);
  const languageLabel = missionLanguageLabel(language);
  const profile = input.profile ?? "generic";

  if (profile === "investor") {
    const fundQuery = `${input.missionContext}\n\nFind 10–15 VC, angel, corporate VC, and accelerator funds matching the brief. Include fund name, stage focus, sector focus, ticket size (if published), HQ/geo, and source URLs.`;

    const partnerQuery = `${input.missionContext}\n\nFind partner/analyst contacts at these funds: full name, title, published email verbatim from source, and source URL (fund team page, press, LinkedIn). Never guess emails. Skip funds without a verifiable contact.`;

    const [fundResults, partnerResults] = await Promise.all([
      searchWebOpenAi(fundQuery),
      searchWebOpenAi(partnerQuery),
    ]);

    return [
      `Mission language: ${languageLabel}`,
      "Qualification mode: investor base (strict)",
      "",
      "=== Fund research ===",
      fundResults,
      "",
      "=== Partner contact research ===",
      partnerResults,
    ].join("\n");
  }

  if (profile === "en") {
    const companyQuery = `${input.missionContext}\n\nFind 10–15 US/UK/EU/international enterprise B2B companies. For each: name, domain, country/HQ, sector, founding year or market tenure, revenue if published, source URLs. Exclude Russian companies.`;

    const contactQuery = `${input.missionContext}\n\nFind real B2B decision-maker contacts for international companies: name, title, published email verbatim from source, source URL. Never guess emails.`;

    const revenueQuery = `${input.missionContext}\n\nFind published revenue figures for these companies from SEC filings, press, Crunchbase, Forbes — only with source URLs.`;

    const [companyResults, contactResults, revenueResults] = await Promise.all([
      searchWebOpenAi(companyQuery),
      searchWebOpenAi(contactQuery),
      searchWebOpenAi(revenueQuery),
    ]);

    return [
      `Mission language: ${languageLabel}`,
      "Qualification mode: EN market (strict)",
      "",
      "=== Company research ===",
      companyResults,
      "",
      "=== Contact research ===",
      contactResults,
      "",
      "=== Revenue research ===",
      revenueResults,
    ].join("\n");
  }

  if (profile === "ru") {
    const companyQuery = `${input.missionContext}\n\nНайди 10–15 российских B2B компаний (enterprise). Для каждой: название, домен, сектор/ОКВЭД, год основания или стаж, выручка (если есть), признаки РФ, ссылки на источники.`;

    const contactQuery = `${input.missionContext}\n\nДля российских B2B компаний найди контакты ЛПР: ФИО, должность, email дословно из источника, URL. Без контакта — не включай.`;

    const revenueQuery = `${input.missionContext}\n\nНайди данные о выручке российских компаний из рейтингов, отчётности, Forbes/РБК — только с URL источника.`;

    const [companyResults, contactResults, revenueResults] = await Promise.all([
      searchWebOpenAi(companyQuery),
      searchWebOpenAi(contactQuery),
      searchWebOpenAi(revenueQuery),
    ]);

    return [
      `Mission language: ${languageLabel}`,
      "Qualification mode: RU market (strict)",
      "",
      "=== Company research ===",
      companyResults,
      "",
      "=== Contact research ===",
      contactResults,
      "",
      "=== Revenue research ===",
      revenueResults,
    ].join("\n");
  }

  const companyQuery =
    language === "ru"
      ? `${input.missionContext}\n\nНайди 10–15 enterprise B2B компаний с бюджетом на цифровую трансформацию. Укажи название, домен, сигналы бюджета и ссылки.`
      : `${input.missionContext}\n\nFind 10–15 enterprise B2B companies with budget for digital transformation. Include company name, domain, budget signals, and source URLs.`;

  const contactQuery =
    language === "ru"
      ? `${input.missionContext}\n\nНайди реальные B2B контакты decision-maker: имя, должность, email дословно из источника, URL.`
      : `${input.missionContext}\n\nFind real B2B decision-maker contacts: name, title, published email, source URL. Never guess emails.`;

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

/** Mission copy language from brief / goal text (Cyrillic → ru, else en). */
export function detectMissionLanguage(...parts: Array<string | null | undefined>): "ru" | "en" {
  const combined = parts.filter(Boolean).join("\n");
  return /[\u0400-\u04FF]/.test(combined) ? "ru" : "en";
}

export function missionLanguageLabel(language: "ru" | "en"): string {
  return language === "ru" ? "Russian" : "English";
}

/**
 * Normalize outbound proposal drafts so agents never leave "[Ваше имя]" placeholders.
 */
const PLACEHOLDER_PATTERNS = [
  /\[Ваше имя\]/gi,
  /\[Your name\]/gi,
  /\[Your Name\]/g,
  /\[Имя\]/gi,
  /С уважением,\s*\n?\s*\[.*?\]/gi,
  /Best regards,\s*\n?\s*\[.*?\]/gi,
  /Kind regards,\s*\n?\s*\[.*?\]/gi,
];

export function nullxesProposalSignOff(language: "ru" | "en" = "ru"): string {
  return language === "ru"
    ? "С уважением,\nNULLXES"
    : "Best regards,\nNULLXES";
}

export function normalizeProposalDraft(
  draft: string,
  language: "ru" | "en" = "ru",
): string {
  let text = draft.trim();
  if (!text) {
    return text;
  }

  for (const pattern of PLACEHOLDER_PATTERNS) {
    text = text.replace(pattern, nullxesProposalSignOff(language));
  }

  // Trailing bare placeholder lines
  text = text
    .replace(/\n\s*\[Ваше имя\]\s*$/i, `\n${nullxesProposalSignOff("ru")}`)
    .replace(/\n\s*\[Your name\]\s*$/i, `\n${nullxesProposalSignOff("en")}`);

  const hasSignOff =
    /с уважением[\s,]*\n?\s*nullxes/i.test(text) ||
    /best regards[\s,]*\n?\s*nullxes/i.test(text) ||
    /kind regards[\s,]*\n?\s*nullxes/i.test(text);

  if (!hasSignOff) {
    text = `${text.replace(/\s+$/, "")}\n\n${nullxesProposalSignOff(language)}`;
  }

  return text.trim();
}

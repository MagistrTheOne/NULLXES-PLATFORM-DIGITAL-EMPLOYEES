import type { KnowledgeSearchResult } from "../types";

const DEFAULT_MAX_CHARS = 8000;

export function formatKnowledgeContext(
  results: KnowledgeSearchResult[],
  maxChars = DEFAULT_MAX_CHARS,
): string {
  if (results.length === 0) {
    return "";
  }

  const sections: string[] = [];
  let usedChars = 0;

  for (const result of results) {
    const section = `[${result.sourceTitle}]\n${result.content.trim()}`;
    if (usedChars + section.length > maxChars) {
      break;
    }
    sections.push(section);
    usedChars += section.length;
  }

  if (sections.length === 0) {
    return "";
  }

  return [
    "Relevant knowledge (use when answering; do not invent facts beyond this):",
    ...sections,
  ].join("\n\n");
}

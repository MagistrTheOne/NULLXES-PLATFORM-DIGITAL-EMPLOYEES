import type { MissionEvidenceItem } from "@/entities/employee-mission";

const RESEARCH_CORPUS_SOURCE = "Research corpus";

export function buildEvidenceFromSearch(searchResults: string): MissionEvidenceItem[] {
  const items: MissionEvidenceItem[] = [
    {
      source: RESEARCH_CORPUS_SOURCE,
      snippet: searchResults,
    },
  ];

  const urlMatches = [...searchResults.matchAll(/https?:\/\/[^\s)>\]"']+/g)]
    .map((match) => match[0])
    .slice(0, 8);

  for (const [index, url] of urlMatches.entries()) {
    items.push({
      source: `Source ${index + 1}`,
      url,
      snippet: searchResults.slice(0, 240),
    });
  }

  return items;
}

export function extractMissionResearchCorpus(
  evidence: MissionEvidenceItem[] | null | undefined,
): string {
  const corpus = evidence?.find((item) => item.source === RESEARCH_CORPUS_SOURCE);
  if (corpus?.snippet?.trim()) {
    return corpus.snippet;
  }

  return (evidence ?? [])
    .map((item) => [item.url, item.snippet].filter(Boolean).join("\n"))
    .join("\n\n");
}

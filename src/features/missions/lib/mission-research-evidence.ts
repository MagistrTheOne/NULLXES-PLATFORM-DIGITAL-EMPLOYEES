import type { MissionEvidenceItem } from "@/entities/employee-mission";

export const RESEARCH_CORPUS_SOURCE = "Research corpus";

function normalizeEvidenceUrl(raw: string): string | null {
  try {
    const url = new URL(raw.replace(/[),.;]+$/g, ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function hostnameLabel(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

/**
 * Persist full research for qualification, plus compact unique source URLs for UI.
 * Do not duplicate the corpus blob into Source N snippets.
 */
export function buildEvidenceFromSearch(
  searchResults: string,
): MissionEvidenceItem[] {
  const corpus = searchResults.trim();
  const items: MissionEvidenceItem[] = [
    {
      source: RESEARCH_CORPUS_SOURCE,
      snippet: corpus,
    },
  ];

  const seen = new Set<string>();
  const urlMatches = [...corpus.matchAll(/https?:\/\/[^\s)>\]"']+/g)];

  for (const match of urlMatches) {
    const normalized = normalizeEvidenceUrl(match[0]);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    if (seen.size > 12) {
      break;
    }

    items.push({
      source: hostnameLabel(normalized),
      url: normalized,
      snippet: "",
    });
  }

  return items;
}

export function isResearchCorpusItem(item: MissionEvidenceItem): boolean {
  return item.source === RESEARCH_CORPUS_SOURCE;
}

export function extractMissionResearchCorpus(
  evidence: MissionEvidenceItem[] | null | undefined,
): string {
  const corpus = evidence?.find((item) => isResearchCorpusItem(item));
  if (corpus?.snippet?.trim()) {
    return corpus.snippet;
  }

  return (evidence ?? [])
    .map((item) => [item.url, item.snippet].filter(Boolean).join("\n"))
    .join("\n\n");
}

export function partitionMissionEvidence(
  evidence: MissionEvidenceItem[] | null | undefined,
): {
  corpus: MissionEvidenceItem | null;
  sources: MissionEvidenceItem[];
  other: MissionEvidenceItem[];
} {
  const list = evidence ?? [];
  const corpus = list.find((item) => isResearchCorpusItem(item)) ?? null;
  const sources: MissionEvidenceItem[] = [];
  const other: MissionEvidenceItem[] = [];

  for (const item of list) {
    if (isResearchCorpusItem(item)) {
      continue;
    }
    if (item.url?.trim()) {
      sources.push(item);
      continue;
    }
    other.push(item);
  }

  return { corpus, sources, other };
}

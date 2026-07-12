"use client";

import type { MissionEvidenceItem } from "@/entities/employee-mission";
import {
  isResearchCorpusItem,
  partitionMissionEvidence,
} from "../lib/mission-research-evidence";

function sourceLabel(item: MissionEvidenceItem): string {
  if (item.source.trim() && !/^Source\s+\d+$/i.test(item.source)) {
    return item.source;
  }
  if (item.url) {
    try {
      return new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
      return item.source || "Source";
    }
  }
  return item.source || "Source";
}

/** Legacy Source N rows copied the corpus head — hide that wall of text. */
function compactSourceSnippet(item: MissionEvidenceItem): string | null {
  const snippet = item.snippet?.trim();
  if (!snippet) {
    return null;
  }
  if (snippet.length > 160) {
    return null;
  }
  if (
    /Mission language:|Qualification mode:|=== Fund research ===|=== Partner contact research ===/.test(
      snippet,
    )
  ) {
    return null;
  }
  return snippet;
}

export function MissionEvidencePanel({
  evidence,
}: {
  evidence: MissionEvidenceItem[];
}) {
  const { corpus, sources, other } = partitionMissionEvidence(evidence);
  const sourceCount = sources.length;
  const hasCorpus = Boolean(corpus?.snippet?.trim());

  if (!hasCorpus && sourceCount === 0 && other.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-[#111111] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-white">Evidence</h2>
        <p className="text-xs text-white/40">
          {sourceCount > 0
            ? `${sourceCount} source${sourceCount === 1 ? "" : "s"}`
            : hasCorpus
              ? "Research stored"
              : null}
        </p>
      </div>

      {sourceCount > 0 ? (
        <ul className="mt-4 divide-y divide-white/6 rounded-xl border border-white/6 bg-black/20">
          {sources.map((item, index) => {
            const label = sourceLabel(item);
            const snippet = compactSourceSnippet(item);
            return (
              <li
                key={`${item.url ?? item.source}-${index}`}
                className="flex flex-col gap-1 px-4 py-3"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate text-sm text-white/85">{label}</span>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs text-white/45 transition-colors hover:text-white hover:underline"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
                {item.url ? (
                  <p className="truncate text-[11px] text-white/35">{item.url}</p>
                ) : null}
                {snippet ? (
                  <p className="text-xs leading-5 text-white/50">{snippet}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {other.map((item, index) => {
        if (isResearchCorpusItem(item)) {
          return null;
        }
        const snippet = compactSourceSnippet(item);
        if (!snippet && !item.url) {
          return null;
        }
        return (
          <div
            key={`${item.source}-other-${index}`}
            className="mt-3 rounded-xl border border-white/6 bg-black/20 px-4 py-3"
          >
            <p className="text-sm text-white/80">{item.source}</p>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-xs text-white/45 hover:text-white hover:underline"
              >
                {item.url}
              </a>
            ) : null}
            {snippet ? (
              <p className="mt-2 text-xs leading-5 text-white/50">{snippet}</p>
            ) : null}
          </div>
        );
      })}

      {hasCorpus && corpus ? (
        <details className="group mt-4 rounded-xl border border-white/6 bg-black/20">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm text-white/70 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3">
              <span>Raw research</span>
              <span className="text-xs text-white/35 group-open:hidden">
                Show
              </span>
              <span className="hidden text-xs text-white/35 group-open:inline">
                Hide
              </span>
            </span>
          </summary>
          <pre className="max-h-72 overflow-auto border-t border-white/6 px-4 py-3 text-xs leading-5 whitespace-pre-wrap text-white/45">
            {corpus.snippet}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

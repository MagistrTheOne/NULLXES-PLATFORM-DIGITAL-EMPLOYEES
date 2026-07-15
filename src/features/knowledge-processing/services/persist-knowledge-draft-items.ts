import type { KnowledgeDraftItem } from "@/features/employees/create/types";
import { createKnowledgeSource } from "../use-cases/create-knowledge-source";
import {
  fetchKnowledgeUrlContent,
  normalizeKnowledgeTextContent,
} from "../lib/extract-knowledge-content";

export type PersistKnowledgeDraftResult = {
  created: number;
  failures: string[];
};

async function resolveDraftContent(
  item: KnowledgeDraftItem,
): Promise<{ title: string; content: string }> {
  if (item.type === "text") {
    return {
      title: item.content.trim().slice(0, 160) || "Pasted text",
      content: normalizeKnowledgeTextContent(item.content),
    };
  }

  if (item.type === "url") {
    return {
      title: item.url,
      content: await fetchKnowledgeUrlContent(item.url),
    };
  }

  if (!item.content?.trim()) {
    throw new Error(`File ${item.name} has no readable content.`);
  }

  return {
    title: item.name,
    content: normalizeKnowledgeTextContent(item.content),
  };
}

export async function persistKnowledgeDraftItems(
  employeeId: string,
  items: KnowledgeDraftItem[],
  organizationId?: string,
): Promise<PersistKnowledgeDraftResult> {
  const failures: string[] = [];
  let created = 0;

  for (const item of items) {
    try {
      const { title, content } = await resolveDraftContent(item);
      await createKnowledgeSource({
        employeeId,
        organizationId,
        type: item.type,
        title,
        chunks: [{ content }],
      });
      created += 1;
    } catch (error) {
      const label =
        item.type === "file"
          ? item.name
          : item.type === "url"
            ? item.url
            : "text";
      const message =
        error instanceof Error ? error.message : "Knowledge persistence failed";
      failures.push(`${label}: ${message}`);
    }
  }

  return { created, failures };
}

"use server";

import { embedTexts } from "@/features/knowledge-retrieval/services/embed-text";
import {
  getCachedQueryEmbedding,
  setCachedQueryEmbedding,
} from "@/features/knowledge-retrieval/services/session-embedding-cache";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";

export async function prefetchTalkQueryEmbeddingAction(
  employeeId: string,
  query: string,
): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) {
    return;
  }

  await requireWorkspacePermissionOrThrowMessage("canOperateEmployees");

  if (getCachedQueryEmbedding(employeeId, trimmed)) {
    return;
  }

  const [embedding] = await embedTexts({ texts: [trimmed] });
  if (embedding) {
    setCachedQueryEmbedding(employeeId, trimmed, embedding);
  }
}

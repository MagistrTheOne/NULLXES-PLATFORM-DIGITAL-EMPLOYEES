"use server";

import { embedTexts } from "@/features/knowledge-retrieval/services/embed-text";
import {
  getCachedQueryEmbedding,
  setCachedQueryEmbedding,
} from "@/features/knowledge-retrieval/services/session-embedding-cache";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { assertWorkspaceAccess } from "@/features/workspace/services/assert-workspace-access";

/**
 * Best-effort embedding prefetch. Must NEVER redirect — landing guest demos
 * share the Talk voice pipeline and would otherwise bounce to /login.
 */
export async function prefetchTalkQueryEmbeddingAction(
  employeeId: string,
  query: string,
): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) {
    return;
  }

  const session = await getCurrentSession();
  if (!session) {
    return;
  }

  try {
    const workspace = await ensureWorkspace(session.user.id, session.user.name);
    assertWorkspaceAccess(workspace.permissions, "canOperateEmployees");
  } catch {
    return;
  }

  if (getCachedQueryEmbedding(employeeId, trimmed)) {
    return;
  }

  const [embedding] = await embedTexts({ texts: [trimmed] });
  if (embedding) {
    setCachedQueryEmbedding(employeeId, trimmed, embedding);
  }
}

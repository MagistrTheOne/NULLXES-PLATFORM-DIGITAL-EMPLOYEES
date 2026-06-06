"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { fetchOpenAiChatModels } from "../services/fetch-openai-chat-models";
import type { OpenAiBrainModelOption } from "../services/fetch-openai-chat-models";

export type GetOpenAiBrainModelsResult =
  | { ok: true; models: OpenAiBrainModelOption[] }
  | { ok: false; message: string };

export async function getOpenAiBrainModelsAction(): Promise<GetOpenAiBrainModelsResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      message: "You do not have permission to view OpenAI models.",
    };
  }

  return fetchOpenAiChatModels();
}

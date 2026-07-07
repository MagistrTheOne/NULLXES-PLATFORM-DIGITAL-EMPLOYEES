"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import type { BrainProvider } from "@/entities/digital-employee";
import { fetchOpenAiChatModels } from "@/features/settings/services/fetch-openai-chat-models";
import {
  getCuratedBrainModels,
  type BrainModelCatalogOption,
} from "../lib/brain-model-catalog";

export type BrainModelOption = BrainModelCatalogOption;

export type GetBrainModelsResult =
  | { ok: true; models: BrainModelOption[] }
  | { ok: false; message: string };

function resolveOpenAiModelGroup(id: string): string {
  if (/nano|mini|flash-lite|lite/i.test(id)) {
    return "fast";
  }

  if (/^o[0-9]/i.test(id)) {
    return "balanced";
  }

  return "recommended";
}

export async function getBrainModelsAction(
  provider: BrainProvider,
): Promise<GetBrainModelsResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageEmployees) {
    return {
      ok: false,
      message: "You do not have permission to view brain models.",
    };
  }

  if (provider === "openai") {
    const result = await fetchOpenAiChatModels();

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      models: result.models.map((model) => ({
        id: model.id,
        label: model.id,
        pricingLabel: model.pricingLabel,
        groupKey: resolveOpenAiModelGroup(model.id),
      })),
    };
  }

  if (provider === "nullxes") {
    const { getNullxesSdkClient } = await import("@/shared/nullxes-sdk");
    const client = getNullxesSdkClient();

    if (client) {
      const models = await client.listModels();
      return {
        ok: true,
        models: models.map((model) => ({
          id: model.id,
          label: model.label ?? model.id,
          groupKey: "managed",
        })),
      };
    }
  }

  return {
    ok: true,
    models: getCuratedBrainModels(provider),
  };
}

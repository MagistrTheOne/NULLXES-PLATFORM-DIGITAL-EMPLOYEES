import { getEmployeeBlueprint } from "@/features/agent-blueprint/queries/get-employee-blueprint";
import { composeShutenTalkSystemPrompt } from "@/features/brain/lib/shuten-system-prompt";
import { formatBrainModelDisplay } from "@/features/brain/lib/format-brain-model-display";
import { resolveBrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import { resolveNullxesBrainMaxTokens } from "@/features/brain/lib/resolve-nullxes-brain-max-tokens";
import { composeTalkSystemPrompt } from "@/features/employees/lib/build-system-prompt";
import {
  appendCharacterBlock,
  appendSkillsBlock,
} from "@/features/agent-blueprint/lib/build-blueprint-prompt-blocks";
import { resolveEmployeePersonaGender } from "@/features/employees/lib/resolve-employee-persona-gender";
import type { BrainProvider } from "@/entities/digital-employee";
import type { TalkSessionBrainCache } from "../types/talk-turn-metrics";
import { getEmployeeTalkContext } from "./get-employee-talk-context";

export async function buildTalkSessionBrainCache(input: {
  organizationId: string;
  employeeId: string;
}): Promise<TalkSessionBrainCache | null> {
  const employee = await getEmployeeTalkContext(
    input.organizationId,
    input.employeeId,
  );
  if (!employee) {
    return null;
  }

  const [apiConfig, blueprint] = await Promise.all([
    resolveBrainApiConfig({
      provider: employee.brainProvider,
      configuredModel: employee.brainModel,
      organizationId: input.organizationId,
    }),
    getEmployeeBlueprint({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
    }),
  ]);

  const personaPrompt = composeTalkSystemPrompt({
    name: employee.name,
    role: employee.role,
    storedPrompt: employee.systemPrompt,
    personaGender: resolveEmployeePersonaGender({
      name: employee.name,
      studioVoiceId: employee.studioVoiceId,
      voiceId: employee.voiceId,
    }),
  });

  const brainPrompt =
    employee.brainProvider === "nullxes"
      ? composeShutenTalkSystemPrompt({ personaPrompt })
      : personaPrompt;

  let systemPromptBase = appendCharacterBlock(
    brainPrompt,
    blueprint.characterPromptBlock,
  );
  systemPromptBase = appendSkillsBlock(systemPromptBase, blueprint.activeSkills);

  const maxTokens =
    employee.brainProvider === "nullxes"
      ? resolveNullxesBrainMaxTokens(employee.maxTokens)
      : employee.maxTokens;

  return {
    v: 1,
    brainProvider: employee.brainProvider,
    model: apiConfig.model,
    brainModelLabel: formatBrainModelDisplay({
      provider: employee.brainProvider,
      modelId: apiConfig.model,
    }),
    systemPromptBase,
    temperature:
      employee.brainProvider === "nullxes"
        ? Math.min(employee.temperature, 0.4)
        : employee.temperature,
    maxTokens,
    employeeName: employee.name,
    employeeRole: employee.role,
    // Always expose grounding + research tools in Talk/Conversations —
    // legacy blueprints may omit list_tasks / search_web / multimodal tools.
    enabledToolSlugs: [
      ...new Set([
        ...blueprint.enabledToolSlugs,
        "list_missions",
        "list_tasks",
        "list_workforce_peers",
        "search_knowledge",
        "search_web",
        "generate_image",
        "analyze_image",
        "create_and_assign_skill",
      ]),
    ],
  };
}

export function talkBrainCacheToRequestConfig(
  cache: TalkSessionBrainCache,
  systemPrompt: string,
): {
  brainProvider: BrainProvider;
  model: string;
  brainModelLabel: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  employeeName: string;
  employeeRole: string;
  enabledToolSlugs: string[];
} {
  return {
    brainProvider: cache.brainProvider as BrainProvider,
    model: cache.model,
    brainModelLabel: cache.brainModelLabel,
    systemPrompt,
    temperature: cache.temperature,
    maxTokens: cache.maxTokens,
    employeeName: cache.employeeName,
    employeeRole: cache.employeeRole,
    // Re-merge every request so warm session caches pick up new tool slugs.
    enabledToolSlugs: [
      ...new Set([
        ...cache.enabledToolSlugs,
        "list_missions",
        "list_tasks",
        "list_workforce_peers",
        "search_knowledge",
        "search_web",
        "generate_image",
        "analyze_image",
        "create_and_assign_skill",
      ]),
    ],
  };
}

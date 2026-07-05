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
import {
  appendScenarioOverlayToPrompt,
  buildScenarioOverlayPrompt,
} from "@/features/scenarios/lib/build-scenario-overlay-prompt";
import { getScenarioTemplateById } from "@/features/scenarios/lib/scenario-templates";
import { getActiveScenarioSessionForTalk } from "@/features/scenarios/services/scenario-session";
import {
  formatKnowledgeContext,
  searchKnowledge,
} from "@/features/knowledge-retrieval";
import { hasReadyKnowledge } from "@/features/knowledge-retrieval/services/has-ready-knowledge";
import type { BrainProvider } from "@/entities/digital-employee";
import { measureTalkPerf } from "../lib/talk-perf-log";
import { getEmployeeTalkContext } from "./get-employee-talk-context";
import type { TalkBrainMessage } from "./generate-talk-brain-response";

export type TalkBrainRequestConfig = {
  brainProvider: BrainProvider;
  model: string;
  brainModelLabel: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  employeeName: string;
  enabledToolSlugs: string[];
};

export async function buildTalkBrainRequest(input: {
  organizationId: string;
  employeeId: string;
  userId?: string;
  scenarioSessionId?: string;
  messages: TalkBrainMessage[];
}): Promise<TalkBrainRequestConfig | null> {
  return measureTalkPerf(
    "talk.brain.build",
    async () => {
      const employee = await getEmployeeTalkContext(
        input.organizationId,
        input.employeeId,
      );
      if (!employee) {
        return null;
      }

      const userQuery = input.messages.at(-1)?.content.trim() ?? "";

      // RAG, brain config, and scenario lookup are independent — run them in
      // parallel to cut serial DB roundtrips before the LLM call.
      const [retrieved, apiConfig, scenarioSession, blueprint] = await Promise.all([
        userQuery
          ? measureTalkPerf(
              "talk.brain.rag",
              async () => {
                // Employees without knowledge skip embedding + pgvector entirely.
                if (!(await hasReadyKnowledge(input.employeeId))) {
                  return [];
                }
                return searchKnowledge({
                  employeeId: input.employeeId,
                  query: userQuery,
                  topK: 4,
                  useSessionCache: true,
                });
              },
              { employeeId: input.employeeId },
            )
          : Promise.resolve([]),
        resolveBrainApiConfig({
          provider: employee.brainProvider,
          configuredModel: employee.brainModel,
          organizationId: input.organizationId,
        }),
        input.scenarioSessionId && input.userId
          ? getActiveScenarioSessionForTalk({
              scenarioSessionId: input.scenarioSessionId,
              organizationId: input.organizationId,
              employeeId: input.employeeId,
              userId: input.userId,
            })
          : Promise.resolve(null),
        getEmployeeBlueprint({
          organizationId: input.organizationId,
          employeeId: input.employeeId,
        }),
      ]);

      const knowledgeBlock = formatKnowledgeContext(retrieved);
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

      let layeredPrompt = appendCharacterBlock(
        brainPrompt,
        blueprint.characterPromptBlock,
      );
      layeredPrompt = appendSkillsBlock(layeredPrompt, blueprint.activeSkills);

      const maxTokens =
        employee.brainProvider === "nullxes"
          ? resolveNullxesBrainMaxTokens(employee.maxTokens)
          : employee.maxTokens;

      let systemPrompt = knowledgeBlock
        ? `${layeredPrompt}\n\n${knowledgeBlock}`
        : layeredPrompt;

      const template = scenarioSession
        ? getScenarioTemplateById(scenarioSession.templateId)
        : undefined;

      if (template) {
        const overlay = buildScenarioOverlayPrompt({
          template,
          employeeName: employee.name,
          employeeRole: employee.role,
        });
        systemPrompt = appendScenarioOverlayToPrompt(systemPrompt, overlay);
      }

      return {
        brainProvider: employee.brainProvider,
        model: apiConfig.model,
        brainModelLabel: formatBrainModelDisplay({
          provider: employee.brainProvider,
          modelId: apiConfig.model,
        }),
        systemPrompt,
        temperature:
          employee.brainProvider === "nullxes"
            ? Math.min(employee.temperature, 0.4)
            : employee.temperature,
        maxTokens,
        employeeName: employee.name,
        enabledToolSlugs: blueprint.enabledToolSlugs,
      };
    },
    { employeeId: input.employeeId },
  );
}

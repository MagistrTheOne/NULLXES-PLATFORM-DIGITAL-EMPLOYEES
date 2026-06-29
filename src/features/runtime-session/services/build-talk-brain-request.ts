import { composeShutenTalkSystemPrompt } from "@/features/brain/lib/shuten-system-prompt";
import { formatBrainModelDisplay } from "@/features/brain/lib/format-brain-model-display";
import { resolveBrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import { resolveNullxesBrainMaxTokens } from "@/features/brain/lib/resolve-nullxes-brain-max-tokens";
import { composeTalkSystemPrompt } from "@/features/employees/lib/build-system-prompt";
import { resolveEmployeePersonaGender } from "@/features/employees/lib/resolve-employee-persona-gender";
import {
  formatKnowledgeContext,
  searchKnowledge,
} from "@/features/knowledge-retrieval";
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
};

export async function buildTalkBrainRequest(input: {
  organizationId: string;
  employeeId: string;
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
      const retrieved = userQuery
        ? await measureTalkPerf(
            "talk.brain.rag",
            () =>
              searchKnowledge({
                employeeId: input.employeeId,
                query: userQuery,
                topK: 4,
                useSessionCache: true,
              }),
            { employeeId: input.employeeId },
          )
        : [];

      const knowledgeBlock = formatKnowledgeContext(retrieved);
      const personaPrompt = composeTalkSystemPrompt({
        name: employee.name,
        role: employee.role,
        storedPrompt: employee.systemPrompt,
        personaGender: resolveEmployeePersonaGender({
          studioVoiceId: employee.studioVoiceId,
          voiceId: employee.voiceId,
        }),
      });

      const brainPrompt =
        employee.brainProvider === "nullxes"
          ? composeShutenTalkSystemPrompt({ personaPrompt })
          : personaPrompt;

      const apiConfig = resolveBrainApiConfig({
        provider: employee.brainProvider,
        configuredModel: employee.brainModel,
      });

      const maxTokens =
        employee.brainProvider === "nullxes"
          ? resolveNullxesBrainMaxTokens(employee.maxTokens)
          : employee.maxTokens;

      return {
        brainProvider: employee.brainProvider,
        model: apiConfig.model,
        brainModelLabel: formatBrainModelDisplay({
          provider: employee.brainProvider,
          modelId: apiConfig.model,
        }),
        systemPrompt: knowledgeBlock
          ? `${brainPrompt}\n\n${knowledgeBlock}`
          : brainPrompt,
        temperature:
          employee.brainProvider === "nullxes"
            ? Math.min(employee.temperature, 0.4)
            : employee.temperature,
        maxTokens,
        employeeName: employee.name,
      };
    },
    { employeeId: input.employeeId },
  );
}

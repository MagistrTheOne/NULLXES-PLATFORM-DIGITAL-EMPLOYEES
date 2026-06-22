import { composeTalkSystemPrompt } from "@/features/employees/lib/build-system-prompt";
import { resolveEmployeePersonaGender } from "@/features/employees/lib/resolve-employee-persona-gender";
import {
  formatKnowledgeContext,
  searchKnowledge,
} from "@/features/knowledge-retrieval";
import { measureTalkPerf } from "../lib/talk-perf-log";
import { getEmployeeTalkContext } from "./get-employee-talk-context";
import type { TalkBrainMessage } from "./generate-talk-brain-response";

export type TalkBrainRequestConfig = {
  model: string;
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
                topK: 6,
                useSessionCache: true,
              }),
            { employeeId: input.employeeId },
          )
        : [];

      const knowledgeBlock = formatKnowledgeContext(retrieved);
      const basePrompt = composeTalkSystemPrompt({
        name: employee.name,
        role: employee.role,
        storedPrompt: employee.systemPrompt,
        personaGender: resolveEmployeePersonaGender({
          studioVoiceId: employee.studioVoiceId,
          voiceId: employee.voiceId,
        }),
      });

      return {
        model: employee.brainModel ?? "gpt-4o",
        systemPrompt: knowledgeBlock
          ? `${basePrompt}\n\n${knowledgeBlock}`
          : basePrompt,
        temperature: employee.temperature,
        maxTokens: employee.maxTokens,
        employeeName: employee.name,
      };
    },
    { employeeId: input.employeeId },
  );
}

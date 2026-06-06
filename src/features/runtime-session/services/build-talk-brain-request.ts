import { composeTalkSystemPrompt } from "@/features/employees/lib/build-system-prompt";
import { resolveEmployeePersonaGender } from "@/features/employees/lib/resolve-employee-persona-gender";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import {
  formatKnowledgeContext,
  searchKnowledge,
} from "@/features/knowledge-retrieval";
import { buildEmployeeRuntimeContext } from "@/features/runtime-engine";
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
  const employee = await getEmployeeDetail(input.organizationId, input.employeeId);
  if (!employee) {
    return null;
  }

  const runtime = await buildEmployeeRuntimeContext({
    employeeId: input.employeeId,
  });

  const userQuery = input.messages.at(-1)?.content.trim() ?? "";
  const retrieved = userQuery
    ? await searchKnowledge({
        employeeId: input.employeeId,
        query: userQuery,
        topK: 6,
      })
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
    model: runtime.brainProvider.config.model ?? employee.brainModel ?? "gpt-4o",
    systemPrompt: knowledgeBlock
      ? `${basePrompt}\n\n${knowledgeBlock}`
      : basePrompt,
    temperature: runtime.limits.temperature ?? 0.7,
    maxTokens: runtime.limits.maxTokens ?? 1024,
    employeeName: employee.name,
  };
}

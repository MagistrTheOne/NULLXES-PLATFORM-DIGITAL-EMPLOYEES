import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import {
  resolveTalkVoiceMode,
  type TalkVoiceMode,
} from "./resolve-talk-voice-mode";

export type TalkRuntimeConfig = {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  voiceMode: TalkVoiceMode;
  voiceId: string | null;
  employeeName: string;
};

export async function getTalkRuntimeConfig(
  organizationId: string,
  employeeId: string,
): Promise<TalkRuntimeConfig | null> {
  const employee = await getEmployeeDetail(organizationId, employeeId);

  if (!employee) {
    return null;
  }

  return {
    model: employee.brainModel ?? "gpt-4o",
    systemPrompt:
      employee.systemPrompt.trim() ||
      `You are ${employee.name}, a ${employee.role}. Respond naturally and concisely in conversation.`,
    temperature: 0.7,
    maxTokens: 1024,
    voiceMode: resolveTalkVoiceMode(employee),
    voiceId: employee.voiceId,
    employeeName: employee.name,
  };
}

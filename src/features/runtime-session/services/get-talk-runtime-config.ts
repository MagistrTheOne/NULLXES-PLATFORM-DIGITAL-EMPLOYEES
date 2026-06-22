import { composeTalkSystemPrompt } from "@/features/employees/lib/build-system-prompt";
import { resolveEmployeePersonaGender } from "@/features/employees/lib/resolve-employee-persona-gender";
import {
  resolveTalkVoiceMode,
  type TalkVoiceMode,
} from "./resolve-talk-voice-mode";
import { getEmployeeTalkContext } from "./get-employee-talk-context";

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
  const employee = await getEmployeeTalkContext(organizationId, employeeId);

  if (!employee) {
    return null;
  }

  return {
    model: employee.brainModel ?? "gpt-4o",
    systemPrompt: composeTalkSystemPrompt({
      name: employee.name,
      role: employee.role,
      storedPrompt: employee.systemPrompt,
      personaGender: resolveEmployeePersonaGender({
        studioVoiceId: employee.studioVoiceId,
        voiceId: employee.voiceId,
      }),
    }),
    temperature: employee.temperature,
    maxTokens: employee.maxTokens,
    voiceMode: resolveTalkVoiceMode(employee),
    voiceId: employee.voiceId,
    employeeName: employee.name,
  };
}

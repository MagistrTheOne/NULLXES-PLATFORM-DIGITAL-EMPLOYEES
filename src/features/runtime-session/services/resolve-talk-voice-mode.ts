import type { EmployeeDetail } from "@/features/employees/types";

export type TalkVoiceMode = "elevenlabs" | "anam";

export function resolveTalkVoiceMode(employee: EmployeeDetail): TalkVoiceMode {
  if (
    employee.sessionVoiceProvider === "elevenlabs" &&
    Boolean(employee.voiceId)
  ) {
    return "elevenlabs";
  }

  return "anam";
}

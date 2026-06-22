import type { EmployeeTalkContext } from "../types/employee-talk-context";

export type TalkVoiceMode = "elevenlabs" | "anam";

export function resolveTalkVoiceMode(
  employee: Pick<
    EmployeeTalkContext,
    "sessionVoiceProvider" | "voiceId" | "studioVoiceId"
  >,
): TalkVoiceMode {
  if (
    employee.sessionVoiceProvider === "elevenlabs" &&
    Boolean(employee.voiceId) &&
    Boolean(employee.studioVoiceId)
  ) {
    return "elevenlabs";
  }

  return "anam";
}

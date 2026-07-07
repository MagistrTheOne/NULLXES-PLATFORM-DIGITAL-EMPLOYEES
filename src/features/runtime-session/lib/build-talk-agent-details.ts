import type { EmployeeTalkContext } from "../types/employee-talk-context";
import type { TalkAgentPanel } from "../queries/get-talk-agent-panel";
import type { TalkActivityItem } from "../queries/get-talk-agent-activity";
import type { TalkAgentDetails } from "../components/talk-agent-details";
import { isXaiVoiceAvailableForEmployee } from "@/shared/config/xai-voice-env";

export function buildTalkAgentDetails(input: {
  employee: Pick<
    EmployeeTalkContext,
    | "id"
    | "name"
    | "role"
    | "avatarPreviewUrl"
    | "avatarProvisioningStatus"
  >;
  panel: TalkAgentPanel;
  locale: string;
  activity?: TalkActivityItem[];
  online?: boolean;
  modelLabel?: string | null;
}): TalkAgentDetails {
  return {
    employeeId: input.employee.id,
    name: input.employee.name,
    role: input.employee.role,
    avatarPreviewUrl: input.employee.avatarPreviewUrl,
    avatarReady: input.employee.avatarProvisioningStatus === "ready",
    online: input.online ?? true,
    modelLabel: input.modelLabel ?? null,
    language: input.locale.toUpperCase(),
    currentTaskTitle: input.panel.currentTaskTitle,
    xaiVoiceAvailable: isXaiVoiceAvailableForEmployee(input.employee.id),
    stats: input.panel.stats,
    activity: input.activity,
  };
}

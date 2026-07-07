"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { buildTalkSessionBrainCache } from "@/features/runtime-session/services/build-talk-session-brain-cache";
import { composeSeedXaiVoiceSystemPrompt } from "@/features/xai-voice/lib/compose-xai-voice-system-prompt";
import { getEmployeeForOrganization } from "@/features/employees/services/get-employee-for-organization";

export async function getDefaultXaiVoiceInstructionsAction(employeeId: string): Promise<
  | { ok: true; instructions: string }
  | { ok: false; message: string }
> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );

    const employee = await getEmployeeForOrganization(
      workspace.organization.id,
      employeeId,
    );
    if (!employee) {
      return { ok: false, message: "Employee not found" };
    }

    const brainCache = await buildTalkSessionBrainCache({
      organizationId: workspace.organization.id,
      employeeId,
    });

    const instructions =
      brainCache?.systemPromptBase ??
      composeSeedXaiVoiceSystemPrompt(employee.name, employee.role);

    return { ok: true, instructions };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}

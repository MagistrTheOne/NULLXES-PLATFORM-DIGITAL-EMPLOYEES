import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { recordWorkEvent } from "@/features/work-event";
import { db } from "@/shared/db/client";
import type {
  AgentToolExecutionContext,
  AgentToolExecutionResult,
  ApprovalRequiredToolName,
} from "../lib/tool-definitions";

export async function requestToolApproval(input: {
  toolName: ApprovalRequiredToolName;
  payload: Record<string, unknown>;
  context: AgentToolExecutionContext;
  summary: string;
}): Promise<AgentToolExecutionResult> {
  const [approval] = await db
    .insert(agentApprovalRequest)
    .values({
      organizationId: input.context.organizationId,
      employeeId: input.context.employeeId,
      actionType: input.toolName,
      payload: {
        ...input.payload,
        sessionId: input.context.sessionId ?? null,
        toolName: input.toolName,
      },
      status: "pending",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })
    .returning({ id: agentApprovalRequest.id });

  await recordWorkEvent({
    organizationId: input.context.organizationId,
    employeeId: input.context.employeeId,
    sessionId: input.context.sessionId,
    eventType: "approval_requested",
    title: `Approval required · ${input.toolName}`,
    summary: input.summary,
    metadata: {
      approvalId: approval?.id,
      toolName: input.toolName,
    },
  });

  return {
    content: `Action "${input.toolName}" requires human approval before it can proceed. A pending request was created in Settings → Approvals.${approval?.id ? ` (approval ${approval.id})` : ""}`,
    requiresApproval: true,
  };
}

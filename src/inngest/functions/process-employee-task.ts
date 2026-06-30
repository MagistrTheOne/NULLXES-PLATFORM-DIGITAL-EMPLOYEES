import { and, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { employeeTask } from "@/entities/task/schema";
import { classifyIntent } from "@/features/agent-router";
import { signOutboundWebhookPayload } from "@/features/public-api/lib/sign-outbound-webhook";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { buildTalkBrainRequest } from "@/features/runtime-session/services/build-talk-brain-request";
import { collectTalkBrainResponse } from "@/features/runtime-session/services/stream-talk-brain-response";
import { recordWorkEvent } from "@/features/work-event";
import { serializeEmployeeTaskResult } from "@/features/employees/lib/format-employee-task-result";
import { completeMissionHandoffStep } from "@/features/missions/services/mission-handoff-chain";
import { db } from "@/shared/db/client";
import { decryptField } from "@/shared/crypto/field-encryption";
import { inngest } from "@/inngest/client";

async function postTaskCallback(input: {
  callbackUrl: string;
  organizationId: string;
  taskId: string;
  result: string;
}): Promise<void> {
  const [settings] = await db
    .select({ secret: organizationSettings.outboundWebhookSecret })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, input.organizationId))
    .limit(1);

  const timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify({
    taskId: input.taskId,
    status: "completed",
    result: input.result,
  });
  const secret = decryptField(settings?.secret)?.trim() ?? "";
  const signature = secret
    ? signOutboundWebhookPayload({ secret, timestamp, body })
    : "";

  await fetch(input.callbackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signature
        ? {
            "X-NULLXES-Timestamp": timestamp,
            "X-NULLXES-Signature": signature,
          }
        : {}),
    },
    body,
  });
}

async function processTaskById(taskId: string, organizationId: string) {
  const task = await db.query.employeeTask.findFirst({
    where: and(
      eq(employeeTask.id, taskId),
      eq(employeeTask.organizationId, organizationId),
    ),
    with: { employee: true },
  });

  if (!task?.employee) {
    return { taskId, skipped: true, reason: "task_not_found" };
  }

  if (task.status === "completed" || task.status === "cancelled") {
    return { taskId, skipped: true, reason: "task_already_final" };
  }

  const intent = await classifyIntent({
    message: `${task.title}\n\n${task.description}`,
    employeeRole: task.employee.role,
  });

  if (intent.intent === "destructive_action") {
    const approved = await db.query.agentApprovalRequest.findFirst({
      where: and(
        eq(agentApprovalRequest.taskId, taskId),
        eq(agentApprovalRequest.status, "approved"),
      ),
    });

    if (!approved) {
      const [approval] = await db
      .insert(agentApprovalRequest)
      .values({
        organizationId,
        employeeId: task.employeeId,
        taskId,
        actionType: intent.suggestedWorkflow || "destructive_action",
        payload: {
          title: task.title,
          description: task.description,
          intent,
        },
        status: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      })
      .returning({ id: agentApprovalRequest.id });

    await recordWorkEvent({
      organizationId,
      employeeId: task.employeeId,
      taskId,
      eventType: "approval_requested",
      title: `Approval required · ${task.title}`,
      summary: task.description,
      metadata: { approvalId: approval?.id, intent: intent.intent },
    });

    return { taskId, status: "awaiting_approval" as const };
    }
  }

  await db
    .update(employeeTask)
    .set({ status: "in_progress" })
    .where(eq(employeeTask.id, taskId));

  const brainRequest = await buildTalkBrainRequest({
    organizationId,
    employeeId: task.employeeId,
    messages: [{ role: "user", content: task.description }],
  });

  if (!brainRequest) {
    throw new Error("Employee runtime not found for task processing");
  }

  const workflowHint =
    intent.intent === "research"
      ? "Research the request thoroughly using knowledge search before answering."
      : intent.intent === "schedule_followup"
        ? "If appropriate, create a follow-up task."
        : intent.intent === "handoff"
          ? "If another employee is better suited, use request_handoff."
          : "";

  const result = await collectTalkBrainResponse({
    brainProvider: brainRequest.brainProvider,
    model: brainRequest.model,
    systemPrompt: workflowHint
      ? `${brainRequest.systemPrompt}\n\nWorkflow: ${workflowHint}`
      : brainRequest.systemPrompt,
    messages: [{ role: "user", content: task.description }],
    temperature: brainRequest.temperature,
    maxTokens: brainRequest.maxTokens,
    toolContext: {
      organizationId,
      employeeId: task.employeeId,
      sessionId: task.sessionId ?? undefined,
    },
  });

  await db
    .update(employeeTask)
    .set({
      status: "completed",
      result: serializeEmployeeTaskResult({ summary: result }),
      completedAt: new Date(),
    })
    .where(eq(employeeTask.id, taskId));

  await recordWorkEvent({
    organizationId,
    employeeId: task.employeeId,
    taskId,
    sessionId: task.sessionId ?? undefined,
    eventType:
      task.source === "followup" ? "followup_executed" : "task_completed",
    title: task.title,
    summary: result.slice(0, 500),
    metadata: { intent: intent.intent, workflow: intent.suggestedWorkflow },
  });

  if (task.callbackUrl) {
    await postTaskCallback({
      callbackUrl: task.callbackUrl,
      organizationId,
      taskId,
      result,
    });

    await recordWorkEvent({
      organizationId,
      employeeId: task.employeeId,
      taskId,
      eventType: "api_response_sent",
      title: `Callback sent · ${task.title}`,
      summary: task.callbackUrl,
    });
  }

  void dispatchOrganizationWebhook({
    organizationId,
    event: "task.completed",
    data: { taskId, employeeId: task.employeeId, result },
  });

  await completeMissionHandoffStep({
    taskId,
    organizationId,
    result,
  });

  return { taskId, status: "completed" as const, intent: intent.intent };
}

export const processEmployeeTaskReceived = inngest.createFunction(
  {
    id: "process-employee-task-received",
    triggers: [{ event: "employee/task.received" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { taskId, organizationId } = event.data as {
      taskId: string;
      organizationId: string;
    };

    return step.run("process-task", async () =>
      processTaskById(taskId, organizationId),
    );
  },
);

export const processEmployeeFollowupDue = inngest.createFunction(
  {
    id: "process-employee-followup-due",
    triggers: [{ event: "employee/followup.due" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { taskId, organizationId } = event.data as {
      taskId: string;
      organizationId: string;
    };

    return step.run("process-followup", async () =>
      processTaskById(taskId, organizationId),
    );
  },
);

export const scanOverdueEmployeeTasks = inngest.createFunction(
  {
    id: "scan-overdue-employee-tasks",
    triggers: [{ cron: "*/15 * * * *" }],
  },
  async ({ step }) => {
    return step.run("scan-overdue", async () => {
      const overdue = await db
        .select({
          id: employeeTask.id,
          organizationId: employeeTask.organizationId,
        })
        .from(employeeTask)
        .where(
          and(
            eq(employeeTask.status, "pending"),
          ),
        );

      let queued = 0;
      const now = Date.now();

      for (const task of overdue) {
        const row = await db.query.employeeTask.findFirst({
          where: eq(employeeTask.id, task.id),
        });

        if (!row?.dueAt || row.dueAt.getTime() > now) {
          continue;
        }

        await inngest.send({
          name: "employee/task.received",
          data: { taskId: task.id, organizationId: task.organizationId },
        });
        queued += 1;
      }

      return { queued };
    });
  },
);

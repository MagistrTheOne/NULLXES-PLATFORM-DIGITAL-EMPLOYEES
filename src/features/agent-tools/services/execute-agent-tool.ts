import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeHandoff } from "@/entities/employee-handoff/schema";
import {
  createEmployeeTask,
  enqueueEmployeeTask,
} from "@/features/agent-tasks";
import { searchKnowledge } from "@/features/knowledge-retrieval";
import { recordWorkEvent } from "@/features/work-event";
import { db } from "@/shared/db/client";
import type {
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../lib/tool-definitions";

function parseJsonArguments(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function executeAgentTool(input: {
  toolName: string;
  argumentsJson: string;
  context: AgentToolExecutionContext;
}): Promise<AgentToolExecutionResult> {
  const args = parseJsonArguments(input.argumentsJson);

  if (input.toolName === "search_knowledge") {
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) {
      return { content: "No search query provided." };
    }

    const results = await searchKnowledge({
      employeeId: input.context.employeeId,
      query,
      topK: 6,
    });

    if (results.length === 0) {
      return { content: "No relevant knowledge found." };
    }

    return {
      content: results
        .map(
          (result) =>
            `[${result.sourceTitle}] (score ${result.similarity.toFixed(2)})\n${result.content}`,
        )
        .join("\n\n"),
    };
  }

  if (input.toolName === "create_follow_up_task") {
    const title = typeof args.title === "string" ? args.title.trim() : "";
    const description =
      typeof args.description === "string" ? args.description.trim() : "";
    const dueInHours =
      typeof args.dueInHours === "number" && args.dueInHours > 0
        ? args.dueInHours
        : 24;

    if (!title || !description) {
      return { content: "Follow-up task requires title and description." };
    }

    const dueAt = new Date(Date.now() + dueInHours * 60 * 60 * 1000);
    const taskId = await createEmployeeTask({
      organizationId: input.context.organizationId,
      employeeId: input.context.employeeId,
      title,
      description,
      source: "talk_tool",
      sessionId: input.context.sessionId,
      dueAt,
    });

    await enqueueEmployeeTask({
      taskId,
      organizationId: input.context.organizationId,
      dueAt,
    });

    await recordWorkEvent({
      organizationId: input.context.organizationId,
      employeeId: input.context.employeeId,
      eventType: "task_received",
      title,
      summary: description,
      taskId,
      sessionId: input.context.sessionId,
      metadata: { source: "talk_tool", dueAt: dueAt.toISOString() },
    });

    return {
      content: `Follow-up task created (ID: ${taskId}).`,
      taskCreated: true,
      taskId,
    };
  }

  if (input.toolName === "request_handoff") {
    const toEmployeeId =
      typeof args.toEmployeeId === "string" ? args.toEmployeeId.trim() : "";
    const reason = typeof args.reason === "string" ? args.reason.trim() : "";
    const contextText =
      typeof args.context === "string" ? args.context.trim() : "";

    if (!toEmployeeId || !reason || !contextText) {
      return {
        content: "Handoff requires toEmployeeId, reason, and context.",
      };
    }

    const [target] = await db
      .select({ id: digitalEmployee.id })
      .from(digitalEmployee)
      .where(
        and(
          eq(digitalEmployee.id, toEmployeeId),
          eq(digitalEmployee.organizationId, input.context.organizationId),
        ),
      )
      .limit(1);

    if (!target) {
      return { content: "Target employee not found in this organization." };
    }

    const taskId = await createEmployeeTask({
      organizationId: input.context.organizationId,
      employeeId: toEmployeeId,
      title: `Handoff: ${reason}`,
      description: contextText,
      source: "handoff",
      sessionId: input.context.sessionId,
    });

    await db.insert(employeeHandoff).values({
      fromEmployeeId: input.context.employeeId,
      toEmployeeId,
      taskId,
      context: { reason, context: contextText },
      status: "pending",
    });

    await enqueueEmployeeTask({
      taskId,
      organizationId: input.context.organizationId,
    });

    await recordWorkEvent({
      organizationId: input.context.organizationId,
      employeeId: input.context.employeeId,
      eventType: "handoff_created",
      title: `Handoff to employee ${toEmployeeId}`,
      summary: reason,
      taskId,
      sessionId: input.context.sessionId,
      metadata: { toEmployeeId, context: contextText },
    });

    return {
      content: `Handoff queued to employee ${toEmployeeId} (task ${taskId}).`,
      taskId,
    };
  }

  return { content: `Unknown tool: ${input.toolName}` };
}

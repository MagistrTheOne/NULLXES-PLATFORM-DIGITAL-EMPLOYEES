import { employeeHandoff } from "@/entities/employee-handoff/schema";
import {
  createEmployeeTask,
  enqueueEmployeeTask,
} from "@/features/agent-tasks";
import {
  listWorkforcePeers,
  resolveWorkforceHandoffTarget,
} from "@/features/employees/services/resolve-workforce-handoff-target";
import { searchKnowledge } from "@/features/knowledge-retrieval";
import { recordWorkEvent } from "@/features/work-event";
import { db } from "@/shared/db/client";
import type {
  AgentToolExecutionContext,
  AgentToolExecutionResult,
} from "../lib/tool-definitions";
import { requestToolApproval } from "./request-tool-approval";

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

  if (input.toolName === "search_web") {
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) {
      return { content: "No web search query provided." };
    }

    const { searchWebOpenAi } = await import("./search-web-openai");
    const result = await searchWebOpenAi(query);
    return { content: result };
  }

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

  if (input.toolName === "list_missions") {
    const limit =
      typeof args.limit === "number" && args.limit > 0
        ? Math.min(Math.floor(args.limit), 10)
        : 5;
    const missionId =
      typeof args.missionId === "string" ? args.missionId.trim() : undefined;

    const { listEmployeeMissionsForAgentTool } = await import(
      "@/features/missions/queries/list-employee-missions-for-agent-tool"
    );

    const content = await listEmployeeMissionsForAgentTool({
      organizationId: input.context.organizationId,
      employeeId: input.context.employeeId,
      limit,
      missionId,
    });

    return { content };
  }

  if (input.toolName === "list_tasks") {
    const limit =
      typeof args.limit === "number" && args.limit > 0
        ? Math.min(Math.floor(args.limit), 20)
        : 8;

    const { getEmployeeTasks } = await import(
      "@/features/employees/services/get-employee-tasks"
    );

    const tasks = await getEmployeeTasks(
      input.context.organizationId,
      input.context.employeeId,
      limit,
    );

    if (tasks.length === 0) {
      return { content: "No tasks on record for this digital employee." };
    }

    return {
      content: tasks
        .map((task) => {
          const due = task.dueAt ? ` · due ${task.dueAt.toISOString()}` : "";
          const result =
            task.result && task.result.trim().length > 0
              ? `\n  Result: ${task.result.slice(0, 200)}${task.result.length > 200 ? "…" : ""}`
              : "";
          return `- [${task.status}] ${task.title} (${task.source})${due}${result}`;
        })
        .join("\n"),
    };
  }

  if (input.toolName === "cancel_mission") {
    const missionId =
      typeof args.missionId === "string" ? args.missionId.trim() : "";
    const reason = typeof args.reason === "string" ? args.reason.trim() : "";

    if (!missionId) {
      return {
        content: "cancel_mission requires missionId. Call list_missions first.",
      };
    }

    return requestToolApproval({
      toolName: "cancel_mission",
      context: input.context,
      payload: { missionId, reason },
      summary: reason || `Cancel mission ${missionId}`,
    });
  }

  if (input.toolName === "restart_mission") {
    const missionId =
      typeof args.missionId === "string" ? args.missionId.trim() : "";
    const brief = typeof args.brief === "string" ? args.brief.trim() : undefined;
    const goal = typeof args.goal === "string" ? args.goal.trim() : undefined;
    const skills =
      typeof args.skills === "string" ? args.skills.trim() : undefined;
    const reason =
      typeof args.reason === "string" ? args.reason.trim() : undefined;

    if (!missionId) {
      return {
        content: "restart_mission requires missionId. Call list_missions first.",
      };
    }

    return requestToolApproval({
      toolName: "restart_mission",
      context: input.context,
      payload: { missionId, brief, goal, skills, reason },
      summary: reason || `Restart mission ${missionId}`,
    });
  }

  if (input.toolName === "list_workforce_peers") {
    const roleQuery =
      typeof args.roleQuery === "string" ? args.roleQuery.trim() : undefined;
    const peers = await listWorkforcePeers({
      organizationId: input.context.organizationId,
      employeeId: input.context.employeeId,
      roleQuery,
    });

    if (peers.length === 0) {
      return { content: "No other digital employees are available for handoff." };
    }

    return {
      content: peers
        .map(
          (peer) =>
            `- ${peer.name} (${peer.role}) · id=${peer.id} · status=${peer.status}`,
        )
        .join("\n"),
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
    const toEmployeeName =
      typeof args.toEmployeeName === "string" ? args.toEmployeeName.trim() : "";
    const reason = typeof args.reason === "string" ? args.reason.trim() : "";
    const contextText =
      typeof args.context === "string" ? args.context.trim() : "";

    if ((!toEmployeeId && !toEmployeeName) || !reason || !contextText) {
      return {
        content:
          "Handoff requires reason, context, and either toEmployeeId or toEmployeeName.",
      };
    }

    const target = await resolveWorkforceHandoffTarget({
      organizationId: input.context.organizationId,
      fromEmployeeId: input.context.employeeId,
      toEmployeeId: toEmployeeId || undefined,
      toEmployeeName: toEmployeeName || undefined,
    });

    if (!target) {
      return {
        content:
          "Target employee not found. Call list_workforce_peers and retry with an exact name or id.",
      };
    }

    const taskId = await createEmployeeTask({
      organizationId: input.context.organizationId,
      employeeId: target.id,
      title: `Handoff: ${reason}`,
      description: contextText,
      source: "handoff",
      sessionId: input.context.sessionId,
    });

    await db.insert(employeeHandoff).values({
      fromEmployeeId: input.context.employeeId,
      toEmployeeId: target.id,
      taskId,
      context: { reason, context: contextText },
      status: "pending",
    });

    await recordWorkEvent({
      organizationId: input.context.organizationId,
      employeeId: input.context.employeeId,
      eventType: "handoff_created",
      title: `Handoff to ${target.name}`,
      summary: reason,
      taskId,
      sessionId: input.context.sessionId,
      metadata: { toEmployeeId: target.id, context: contextText },
    });

    return {
      content: `Handoff queued to ${target.name} (task ${taskId}).`,
      taskId,
    };
  }

  if (input.toolName === "draft_email") {
    const to = typeof args.to === "string" ? args.to.trim() : "";
    const subject = typeof args.subject === "string" ? args.subject.trim() : "";
    const body = typeof args.body === "string" ? args.body.trim() : "";

    if (!to || !subject || !body) {
      return { content: "Email draft requires to, subject, and body." };
    }

    const draft = `To: ${to}\nSubject: ${subject}\n\n${body}`;

    return requestToolApproval({
      toolName: "draft_email",
      context: input.context,
      payload: { to, subject, body, draft },
      summary: `Draft email to ${to} · ${subject}`,
    });
  }

  return { content: `Unknown tool: ${input.toolName}` };
}

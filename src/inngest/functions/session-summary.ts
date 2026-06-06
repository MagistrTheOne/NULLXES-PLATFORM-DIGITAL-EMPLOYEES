import { eq } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import {
  createEmployeeTask,
  enqueueEmployeeTask,
} from "@/features/agent-tasks";
import { createKnowledgeSource } from "@/features/knowledge-processing";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { getSessionTranscript } from "@/features/runtime-session/services/append-session-message";
import { summarizeSessionTranscript } from "@/features/runtime-session/services/summarize-session-transcript";
import { recordWorkEvent } from "@/features/work-event";
import { db } from "@/shared/db/client";
import { inngest } from "@/inngest/client";

export const summarizeCompletedSession = inngest.createFunction(
  {
    id: "session-summary-completed",
    triggers: [{ event: "employee/session.completed" }],
  },
  async ({ event, step }) => {
    const { sessionId, organizationId } = event.data as {
      sessionId: string;
      organizationId: string;
    };

    const sessionRow = await step.run("load-session", async () => {
      return db.query.employeeSession.findFirst({
        where: eq(employeeSession.id, sessionId),
        with: { employee: true },
      });
    });

    if (!sessionRow?.employee) {
      return { sessionId, skipped: true, reason: "session_not_found" };
    }

    const transcript = await step.run("load-transcript", async () =>
      getSessionTranscript(sessionId),
    );

    if (transcript.length === 0) {
      return { sessionId, skipped: true, reason: "empty_transcript" };
    }

    const summary = await step.run("summarize", async () =>
      summarizeSessionTranscript({
        employeeName: sessionRow.employee.name,
        employeeRole: sessionRow.employee.role,
        transcript,
      }),
    );

    if (!summary?.summary) {
      return { sessionId, skipped: true, reason: "summary_failed" };
    }

    const knowledge = await step.run("write-knowledge", async () => {
      const created = await createKnowledgeSource({
        employeeId: sessionRow.employeeId,
        type: "session_summary",
        title: `Session summary · ${new Date().toISOString().slice(0, 10)}`,
        chunks: [{ content: summary.summary }],
      });

      await db
        .update(employeeSession)
        .set({
          summary: summary.summary,
          primaryTopic: summary.primaryTopic,
          resolved: summary.resolved,
          summaryKnowledgeSourceId: created.source.id,
        })
        .where(eq(employeeSession.id, sessionId));

      return created.source.id;
    });

    await step.run("record-work-event", async () => {
      await recordWorkEvent({
        organizationId,
        employeeId: sessionRow.employeeId,
        sessionId,
        eventType: "session_summarized",
        title: `Session summarized · ${sessionRow.employee.name}`,
        summary: summary.summary,
        metadata: {
          primaryTopic: summary.primaryTopic,
          resolved: summary.resolved,
          knowledgeSourceId: knowledge,
        },
      });
    });

    await step.run("schedule-followups", async () => {
      for (const followUp of summary.followUps) {
        const title = followUp.title?.trim();
        const description = followUp.description?.trim();
        if (!title || !description) {
          continue;
        }

        const dueInHours =
          typeof followUp.dueInHours === "number" && followUp.dueInHours > 0
            ? followUp.dueInHours
            : 24;
        const dueAt = new Date(Date.now() + dueInHours * 60 * 60 * 1000);

        const taskId = await createEmployeeTask({
          organizationId,
          employeeId: sessionRow.employeeId,
          title,
          description,
          source: "session_summary",
          sessionId,
          dueAt,
        });

        await enqueueEmployeeTask({ taskId, organizationId, dueAt });
      }
    });

    await step.run("dispatch-webhook", async () => {
      void dispatchOrganizationWebhook({
        organizationId,
        event: "session.summarized",
        data: {
          sessionId,
          employeeId: sessionRow.employeeId,
          primaryTopic: summary.primaryTopic,
          resolved: summary.resolved,
          knowledgeSourceId: knowledge,
        },
      });
    });

    return {
      sessionId,
      knowledgeSourceId: knowledge,
      followUpCount: summary.followUps.length,
    };
  },
);

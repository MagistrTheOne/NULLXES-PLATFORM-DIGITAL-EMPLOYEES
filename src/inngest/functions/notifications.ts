import { and, count, eq, gte } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { deliverWorkspaceNotification } from "../lib/deliver-workspace-notification";
import { inngest } from "../client";

function notificationHtml(title: string, lines: string[]): string {
  const body = lines.map((line) => `<p>${line}</p>`).join("");
  return `<p><strong>${title}</strong></p>${body}<p style="color:#666;font-size:12px;">NULLXES Digital Employees</p>`;
}

export const sendWeeklyDigest = inngest.createFunction(
  { id: "notifications-weekly-digest", triggers: [{ cron: "0 9 * * 1" }] },
  async ({ step }) => {
    return step.run("dispatch-weekly-digest", async () => {
      const orgs = await db
        .select({
          id: organization.id,
          name: organization.name,
        })
        .from(organization)
        .innerJoin(
          organizationSettings,
          eq(organizationSettings.organizationId, organization.id),
        )
        .where(eq(organizationSettings.notifyWeeklyDigest, true));

      let dispatched = 0;

      for (const org of orgs) {
        const weekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

        const [employeeCountRow, sessionCountRow] = await Promise.all([
          db
            .select({ total: count() })
            .from(digitalEmployee)
            .where(eq(digitalEmployee.organizationId, org.id)),
          db
            .select({ total: count() })
            .from(employeeSession)
            .where(
              and(
                eq(employeeSession.organizationId, org.id),
                gte(employeeSession.createdAt, weekAgo),
              ),
            ),
        ]);

        const employeeCount = Number(employeeCountRow[0]?.total ?? 0);
        const sessionCount = Number(sessionCountRow[0]?.total ?? 0);

        const result = await deliverWorkspaceNotification({
          organizationId: org.id,
          kind: "notifyWeeklyDigest",
          subject: `Weekly digest · ${org.name}`,
          html: notificationHtml(`Weekly workforce summary — ${org.name}`, [
            `Digital employees: ${employeeCount}`,
            `Talk sessions (last 7 days): ${sessionCount}`,
          ]),
        });

        if (result.notified) {
          dispatched += 1;
        }
      }

      return { dispatched };
    });
  },
);

export const notifySessionCompleted = inngest.createFunction(
  {
    id: "notifications-session-completed",
    triggers: [{ event: "employee/session.completed" }],
  },
  async ({ event, step }) => {
    return step.run("notify-session-completed", async () => {
      const { sessionId, organizationId } = event.data as {
        sessionId: string;
        organizationId: string;
      };

      const row = await db.query.employeeSession.findFirst({
        where: eq(employeeSession.id, sessionId),
        with: { employee: true },
      });

      const employeeName = row?.employee?.name ?? "Digital employee";
      const durationSeconds = row?.durationSeconds ?? 0;

      const result = await deliverWorkspaceNotification({
        organizationId,
        kind: "notifySessionCompleted",
        subject: `Talk session completed · ${employeeName}`,
        html: notificationHtml("Talk session completed", [
          `Employee: ${employeeName}`,
          `Duration: ${Math.max(0, durationSeconds)}s`,
          `Session ID: ${sessionId}`,
        ]),
      });

      return { sessionId, notified: result.notified, recipientCount: result.recipientCount };
    });
  },
);

export const notifyKnowledgeFailed = inngest.createFunction(
  {
    id: "notifications-knowledge-failed",
    triggers: [{ event: "knowledge/processing.failed" }],
  },
  async ({ event, step }) => {
    return step.run("notify-knowledge-failed", async () => {
      const { sourceId, organizationId, title, failureReason, employeeName } =
        event.data as {
          sourceId: string;
          organizationId: string;
          title: string;
          failureReason: string;
          employeeName: string;
        };

      const result = await deliverWorkspaceNotification({
        organizationId,
        kind: "notifyKnowledgeFailed",
        subject: `Knowledge processing failed · ${employeeName}`,
        html: notificationHtml("Knowledge processing failed", [
          `Employee: ${employeeName}`,
          `Source: ${title}`,
          `Reason: ${failureReason}`,
          `Source ID: ${sourceId}`,
        ]),
      });

      return { sourceId, notified: result.notified, recipientCount: result.recipientCount };
    });
  },
);

export const notifyEmployeeCreated = inngest.createFunction(
  {
    id: "notifications-employee-created",
    triggers: [{ event: "employee/created" }],
  },
  async ({ event, step }) => {
    return step.run("notify-employee-created", async () => {
      const { employeeId, organizationId, name, role } = event.data as {
        employeeId: string;
        organizationId: string;
        name: string;
        role: string;
      };

      const result = await deliverWorkspaceNotification({
        organizationId,
        kind: "notifyEmployeeCreated",
        subject: `Digital employee created · ${name}`,
        html: notificationHtml("New digital employee", [
          `Name: ${name}`,
          `Role: ${role}`,
          `Employee ID: ${employeeId}`,
        ]),
      });

      return { employeeId, notified: result.notified, recipientCount: result.recipientCount };
    });
  },
);

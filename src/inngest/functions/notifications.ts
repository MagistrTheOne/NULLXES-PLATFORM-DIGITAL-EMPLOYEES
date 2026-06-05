import { inngest } from "../client";

export const sendWeeklyDigest = inngest.createFunction(
  { id: "notifications-weekly-digest", triggers: [{ cron: "0 9 * * 1" }] },
  async ({ step }) => {
    await step.run("dispatch-weekly-digest", async () => {
      return { dispatched: 0 };
    });
  },
);

export const notifySessionCompleted = inngest.createFunction(
  {
    id: "notifications-session-completed",
    triggers: [{ event: "employee/session.completed" }],
  },
  async ({ event, step }) => {
    await step.run("notify-session-completed", async () => {
      return { sessionId: event.data.sessionId, notified: false };
    });
  },
);

export const notifyKnowledgeFailed = inngest.createFunction(
  {
    id: "notifications-knowledge-failed",
    triggers: [{ event: "knowledge/processing.failed" }],
  },
  async ({ event, step }) => {
    await step.run("notify-knowledge-failed", async () => {
      return { sourceId: event.data.sourceId, notified: false };
    });
  },
);

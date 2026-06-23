import { expireStaleEmployeeSessions } from "@/features/runtime-session/services/expire-stale-employee-sessions";
import { inngest } from "../client";

export const expireStaleEmployeeSessionsJob = inngest.createFunction(
  {
    id: "expire-stale-employee-sessions",
    triggers: [{ cron: "*/5 * * * *" }],
  },
  async ({ step }) => {
    return step.run("expire-stale-sessions", async () => {
      return expireStaleEmployeeSessions();
    });
  },
);

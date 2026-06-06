import { runRetentionPurgeForAllOrganizations } from "@/features/security/services/run-retention-purge";
import { inngest } from "../client";

export const retentionPurge = inngest.createFunction(
  {
    id: "retention-purge-daily",
    triggers: [{ cron: "0 3 * * *" }],
  },
  async ({ step }) => {
    return step.run("purge-expired-sessions", async () => {
      return runRetentionPurgeForAllOrganizations();
    });
  },
);

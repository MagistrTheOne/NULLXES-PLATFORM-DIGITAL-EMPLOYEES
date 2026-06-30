import { inngest } from "@/inngest/client";
import { runDueMissionSchedules } from "@/features/missions/services/run-due-mission-schedules";

// 09:00 Europe/Moscow = 06:00 UTC
export const runMissionSchedulesDaily = inngest.createFunction(
  {
    id: "run-mission-schedules-daily",
    triggers: [{ cron: "0 6 * * *" }],
    retries: 2,
  },
  async ({ step }) =>
    step.run("run-due-mission-schedules", async () => runDueMissionSchedules()),
);

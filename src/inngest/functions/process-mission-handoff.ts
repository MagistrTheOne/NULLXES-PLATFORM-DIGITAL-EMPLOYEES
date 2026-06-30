import { inngest } from "@/inngest/client";
import { startMissionHandoffChain } from "@/features/missions/services/mission-handoff-chain";

export const processMissionHandoffStart = inngest.createFunction(
  {
    id: "process-mission-handoff-start",
    triggers: [{ event: "employee/mission.handoff.start" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { missionId, organizationId } = event.data as {
      missionId: string;
      organizationId: string;
    };

    return step.run("start-mission-handoff-chain", async () => {
      await startMissionHandoffChain({ missionId, organizationId });
      return { missionId, started: true };
    });
  },
);

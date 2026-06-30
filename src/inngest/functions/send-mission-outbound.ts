import { inngest } from "@/inngest/client";
import { executeMissionOutbound } from "@/features/missions/services/execute-mission-outbound";

export const sendMissionOutboundOnApprove = inngest.createFunction(
  {
    id: "send-mission-outbound-on-approve",
    triggers: [{ event: "employee/mission.outbound.send" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { missionId, organizationId } = event.data as {
      missionId: string;
      organizationId: string;
    };

    return step.run("send-mission-outbound", async () =>
      executeMissionOutbound({ missionId, organizationId }),
    );
  },
);

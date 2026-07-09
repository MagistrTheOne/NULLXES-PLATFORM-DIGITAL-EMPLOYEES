import { count, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { integrationConnection } from "@/entities/integration-connection/schema";
import type { SystemStatusItem } from "@/features/overview/types";
import { getSystemStatus } from "@/features/overview/services/get-system-status";
import { db } from "@/shared/db/client";

export async function getWorkspaceIntegrations(
  organizationId: string,
): Promise<SystemStatusItem[]> {
  const base = getSystemStatus();

  const [providerRows, connections] = await Promise.all([
    db
      .select({
        providerType: employeeProviderConfig.providerType,
        total: count(),
      })
      .from(employeeProviderConfig)
      .innerJoin(
        digitalEmployee,
        eq(employeeProviderConfig.employeeId, digitalEmployee.id),
      )
      .where(eq(digitalEmployee.organizationId, organizationId))
      .groupBy(employeeProviderConfig.providerType),
    db
      .select()
      .from(integrationConnection)
      .where(eq(integrationConnection.organizationId, organizationId)),
  ]);

  const avatarConfigs =
    providerRows.find((row) => row.providerType === "avatar")?.total ?? 0;
  const sessionConfigs =
    providerRows.find((row) => row.providerType === "session")?.total ?? 0;

  const slack = connections.find((row) => row.provider === "slack");
  const teams = connections.find((row) => row.provider === "teams");

  return [
    ...base,
    {
      label: "Anam (employee configs)",
      status: avatarConfigs > 0 ? "operational" : "degraded",
      detail:
        avatarConfigs > 0
          ? `${avatarConfigs} avatar provider config(s)`
          : "No employee avatar configs yet",
    },
    {
      label: "ElevenLabs (employee configs)",
      status: sessionConfigs > 0 ? "operational" : "degraded",
      detail:
        sessionConfigs > 0
          ? `${sessionConfigs} session provider config(s)`
          : "No employee voice/session configs yet",
    },
    {
      label: "Slack",
      status:
        slack?.status === "connected"
          ? "degraded"
          : slack?.status === "error"
            ? "degraded"
            : "unavailable",
      detail:
        slack?.status === "connected"
          ? "OAuth connected · messaging soon"
          : "Not connected",
    },
    {
      label: "Microsoft Teams",
      status:
        teams?.status === "connected"
          ? "degraded"
          : teams?.status === "error"
            ? "degraded"
            : "unavailable",
      detail:
        teams?.status === "connected"
          ? "Preview · authorization only"
          : "Not connected",
    },
  ];
}

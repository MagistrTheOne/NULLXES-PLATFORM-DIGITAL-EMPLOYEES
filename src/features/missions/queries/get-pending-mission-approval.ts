import { and, desc, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { db } from "@/shared/db/client";

export type MissionPendingApproval = {
  id: string;
  actionType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date | null;
};

export async function getPendingMissionApproval(
  organizationId: string,
  missionId: string,
): Promise<MissionPendingApproval | null> {
  const rows = await db
    .select({
      id: agentApprovalRequest.id,
      actionType: agentApprovalRequest.actionType,
      payload: agentApprovalRequest.payload,
      createdAt: agentApprovalRequest.createdAt,
      expiresAt: agentApprovalRequest.expiresAt,
    })
    .from(agentApprovalRequest)
    .where(
      and(
        eq(agentApprovalRequest.organizationId, organizationId),
        eq(agentApprovalRequest.status, "pending"),
        eq(agentApprovalRequest.actionType, "mission_proposals"),
      ),
    )
    .orderBy(desc(agentApprovalRequest.createdAt))
    .limit(20);

  const match = rows.find(
    (row) =>
      typeof row.payload?.missionId === "string" &&
      row.payload.missionId === missionId,
  );

  if (!match) {
    return null;
  }

  return {
    ...match,
    payload: match.payload ?? {},
  };
}

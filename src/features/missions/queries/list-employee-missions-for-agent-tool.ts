import { and, desc, eq } from "drizzle-orm";
import {
  employeeMission,
  type MissionLeadItem,
} from "@/entities/employee-mission";
import { db } from "@/shared/db/client";

function statusLabel(
  status: typeof employeeMission.$inferSelect["status"],
): string {
  switch (status) {
    case "planned":
      return "Planned";
    case "working":
      return "In progress";
    case "waiting_approval":
      return "Awaiting approval";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function formatLeadOutbound(lead: MissionLeadItem): string[] {
  const lines = [`    · ${lead.companyName}`];

  if (lead.contactName || lead.contactEmail) {
    lines.push(
      `      Contact: ${[lead.contactName, lead.contactEmail].filter(Boolean).join(" · ")}`,
    );
  }

  if (lead.whyFit) {
    lines.push(`      Why: ${lead.whyFit.slice(0, 160)}${lead.whyFit.length > 160 ? "…" : ""}`);
  }

  if (lead.sentAt) {
    lines.push(`      Outbound: sent ${lead.sentAt}`);
  } else if (lead.sendError) {
    lines.push(`      Outbound: not sent — ${lead.sendError}`);
  } else if (lead.contactEmail) {
    lines.push("      Outbound: draft only (not sent yet)");
  }

  return lines;
}

export async function listEmployeeMissionsForAgentTool(input: {
  organizationId: string;
  employeeId: string;
  limit?: number;
  missionId?: string;
}): Promise<string> {
  const conditions = [
    eq(employeeMission.organizationId, input.organizationId),
    eq(employeeMission.employeeId, input.employeeId),
  ];

  if (input.missionId?.trim()) {
    conditions.push(eq(employeeMission.id, input.missionId.trim()));
  }

  const rows = await db
    .select({
      id: employeeMission.id,
      title: employeeMission.title,
      goal: employeeMission.goal,
      status: employeeMission.status,
      brief: employeeMission.brief,
      skills: employeeMission.skills,
      leads: employeeMission.leads,
      handoffs: employeeMission.handoffs,
      timeline: employeeMission.timeline,
      updatedAt: employeeMission.updatedAt,
      errorMessage: employeeMission.errorMessage,
    })
    .from(employeeMission)
    .where(and(...conditions))
    .orderBy(desc(employeeMission.updatedAt))
    .limit(input.missionId ? 1 : (input.limit ?? 5));

  if (rows.length === 0) {
    return input.missionId
      ? "Mission not found for this digital employee."
      : "No missions are assigned to this digital employee.";
  }

  return rows
    .map((mission) => {
      const leads = Array.isArray(mission.leads)
        ? (mission.leads as MissionLeadItem[])
        : [];
      const sentCount = leads.filter((lead) => lead.sentAt).length;
      const skippedCount = leads.filter((lead) => lead.sendError && !lead.sentAt).length;
      const skills =
        Array.isArray(mission.skills) && mission.skills.length > 0
          ? mission.skills.join(", ")
          : null;

      const recentTimeline = (mission.timeline ?? [])
        .slice(-4)
        .map((step) => step.label)
        .join(" → ");

      const handoffSummary = (mission.handoffs ?? [])
        .map(
          (handoff) =>
            `${handoff.toEmployeeName} (${handoff.stage.replaceAll("_", " ")}) · ${handoff.status}`,
        )
        .join("; ");

      const leadLines =
        leads.length > 0
          ? ["  Leads:", ...leads.flatMap(formatLeadOutbound)]
          : [];

      return [
        `- ${mission.title} (id=${mission.id})`,
        `  Status: ${statusLabel(mission.status)}`,
        mission.goal ? `  Goal: ${mission.goal}` : null,
        skills ? `  Skills: ${skills}` : null,
        `  Brief: ${mission.brief.slice(0, 180)}${mission.brief.length > 180 ? "…" : ""}`,
        leads.length > 0
          ? `  Outbound summary: ${sentCount} sent, ${skippedCount} skipped/failed, ${leads.length} total`
          : null,
        recentTimeline ? `  Recent timeline: ${recentTimeline}` : null,
        handoffSummary ? `  Handoffs: ${handoffSummary}` : null,
        ...leadLines,
        mission.errorMessage ? `  Error: ${mission.errorMessage}` : null,
        `  Updated: ${mission.updatedAt.toISOString()}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

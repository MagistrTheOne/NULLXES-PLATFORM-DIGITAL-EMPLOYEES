import { and, desc, eq } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission";
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

export async function listEmployeeMissionsForAgentTool(input: {
  organizationId: string;
  employeeId: string;
  limit?: number;
}): Promise<string> {
  const rows = await db
    .select({
      id: employeeMission.id,
      title: employeeMission.title,
      goal: employeeMission.goal,
      status: employeeMission.status,
      brief: employeeMission.brief,
      skills: employeeMission.skills,
      leadsCount: employeeMission.leads,
      updatedAt: employeeMission.updatedAt,
      errorMessage: employeeMission.errorMessage,
    })
    .from(employeeMission)
    .where(
      and(
        eq(employeeMission.organizationId, input.organizationId),
        eq(employeeMission.employeeId, input.employeeId),
      ),
    )
    .orderBy(desc(employeeMission.updatedAt))
    .limit(input.limit ?? 5);

  if (rows.length === 0) {
    return "No missions are assigned to this digital employee.";
  }

  return rows
    .map((mission) => {
      const leadsCount = Array.isArray(mission.leadsCount)
        ? mission.leadsCount.length
        : 0;
      const skills =
        Array.isArray(mission.skills) && mission.skills.length > 0
          ? mission.skills.join(", ")
          : null;

      return [
        `- ${mission.title} (id=${mission.id})`,
        `  Status: ${statusLabel(mission.status)}`,
        mission.goal ? `  Goal: ${mission.goal}` : null,
        skills ? `  Skills: ${skills}` : null,
        `  Brief: ${mission.brief.slice(0, 180)}${mission.brief.length > 180 ? "…" : ""}`,
        leadsCount > 0 ? `  Proposals: ${leadsCount}` : null,
        mission.errorMessage ? `  Error: ${mission.errorMessage}` : null,
        `  Updated: ${mission.updatedAt.toISOString()}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

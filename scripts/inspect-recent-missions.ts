import { loadEnvFiles } from "@/shared/config/load-env-files";
import { desc } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission/schema";
import { missionSchedule } from "@/entities/mission-schedule/schema";
import { db } from "@/shared/db/client";

loadEnvFiles();

async function main() {
  const missions = await db
    .select({
      id: employeeMission.id,
      title: employeeMission.title,
      status: employeeMission.status,
      errorMessage: employeeMission.errorMessage,
      type: employeeMission.type,
      source: employeeMission.source,
      createdAt: employeeMission.createdAt,
      brief: employeeMission.brief,
    })
    .from(employeeMission)
    .orderBy(desc(employeeMission.createdAt))
    .limit(10);

  const schedules = await db
    .select({
      id: missionSchedule.id,
      title: missionSchedule.title,
      brief: missionSchedule.brief,
      type: missionSchedule.type,
      lastRunAt: missionSchedule.lastRunAt,
    })
    .from(missionSchedule)
    .limit(5);

  console.log("RECENT_MISSIONS", JSON.stringify(missions, null, 2));
  console.log("SCHEDULES", JSON.stringify(schedules, null, 2));
}

main().catch(console.error);

import { and, eq, gte } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission";
import { missionSchedule } from "@/entities/mission-schedule";
import {
  composeScheduledMissionRun,
  getEmployeeName,
  syncLegacyScheduleIfNeeded,
} from "./compose-scheduled-mission-run";
import {
  createEmployeeMission,
  enqueueEmployeeMission,
} from "./create-employee-mission";
import { ensureDefaultYukiSchedulesForAllOrganizations } from "./ensure-default-yuki-schedule";
import { db } from "@/shared/db/client";

function startOfDayInTimezone(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

function isSameCalendarDayInTimezone(
  left: Date,
  right: Date,
  timeZone: string,
): boolean {
  return (
    startOfDayInTimezone(left, timeZone).getTime() ===
    startOfDayInTimezone(right, timeZone).getTime()
  );
}

async function hasActiveScheduledRunToday(input: {
  scheduleId: string;
  timezone: string;
}): Promise<boolean> {
  const dayStart = startOfDayInTimezone(new Date(), input.timezone);

  const rows = await db
    .select({ id: employeeMission.id, status: employeeMission.status })
    .from(employeeMission)
    .where(
      and(
        eq(employeeMission.scheduleId, input.scheduleId),
        gte(employeeMission.createdAt, dayStart),
      ),
    )
    .limit(20);

  return rows.some(
    (row) =>
      row.status !== "cancelled" &&
      row.status !== "failed" &&
      row.status !== "completed",
  );
}

export async function runDueMissionSchedules(): Promise<{
  scanned: number;
  started: number;
  skipped: number;
}> {
  await ensureDefaultYukiSchedulesForAllOrganizations();

  const schedules = await db
    .select()
    .from(missionSchedule)
    .where(eq(missionSchedule.enabled, true));

  let started = 0;
  let skipped = 0;

  for (const schedule of schedules) {
    if (
      schedule.lastRunAt &&
      isSameCalendarDayInTimezone(
        schedule.lastRunAt,
        new Date(),
        schedule.timezone,
      )
    ) {
      skipped += 1;
      continue;
    }

    if (
      await hasActiveScheduledRunToday({
        scheduleId: schedule.id,
        timezone: schedule.timezone,
      })
    ) {
      skipped += 1;
      continue;
    }

    const employeeName = await getEmployeeName(schedule.employeeId);
    await syncLegacyScheduleIfNeeded(schedule, employeeName);

    const runPayload = await composeScheduledMissionRun({
      schedule,
      employeeName,
    });

    const missionId = await createEmployeeMission({
      organizationId: schedule.organizationId,
      employeeId: schedule.employeeId,
      createdByUserId: schedule.createdByUserId,
      title: runPayload.title,
      goal: runPayload.goal,
      brief: runPayload.brief,
      type: runPayload.type,
      source: "scheduled",
      scheduleId: schedule.id,
    });

    await enqueueEmployeeMission({
      missionId,
      organizationId: schedule.organizationId,
    });

    await db
      .update(missionSchedule)
      .set({ lastRunAt: new Date() })
      .where(eq(missionSchedule.id, schedule.id));

    started += 1;
  }

  return { scanned: schedules.length, started, skipped };
}

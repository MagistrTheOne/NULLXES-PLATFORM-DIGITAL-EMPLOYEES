import { organization } from "@/entities/organization/schema";
import { and, eq, ilike } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { missionSchedule } from "@/entities/mission-schedule";
import {
  defaultProspectingBrief,
  defaultProspectingTitle,
} from "./create-employee-mission";
import { syncLegacyScheduleIfNeeded } from "./compose-scheduled-mission-run";
import { getOrganizationOwnerUserId } from "./get-organization-owner-user-id";
import { db } from "@/shared/db/client";

const YUKI_DAILY_CRON = "0 6 * * *";
const YUKI_TIMEZONE = "Europe/Moscow";

export async function ensureDefaultYukiSchedule(input: {
  organizationId: string;
}): Promise<{ scheduleId: string; created: boolean } | null> {
  const ownerUserId = await getOrganizationOwnerUserId(input.organizationId);
  if (!ownerUserId) {
    return null;
  }

  const [yuki] = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
    })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.organizationId, input.organizationId),
        eq(digitalEmployee.status, "active"),
        ilike(digitalEmployee.name, "Yuki%"),
      ),
    )
    .limit(1);

  if (!yuki) {
    return null;
  }

  const [existing] = await db
    .select()
    .from(missionSchedule)
    .where(
      and(
        eq(missionSchedule.organizationId, input.organizationId),
        eq(missionSchedule.employeeId, yuki.id),
        eq(missionSchedule.enabled, true),
      ),
    )
    .limit(1);

  if (existing) {
    await syncLegacyScheduleIfNeeded(existing, yuki.name);
    return { scheduleId: existing.id, created: false };
  }

  const [created] = await db
    .insert(missionSchedule)
    .values({
      organizationId: input.organizationId,
      employeeId: yuki.id,
      createdByUserId: ownerUserId,
      type: "prospecting",
      title: defaultProspectingTitle(yuki.name),
      brief: defaultProspectingBrief(),
      cronExpression: YUKI_DAILY_CRON,
      timezone: YUKI_TIMEZONE,
      enabled: true,
    })
    .returning({ id: missionSchedule.id });

  if (!created) {
    return null;
  }

  return { scheduleId: created.id, created: true };
}

export async function ensureDefaultYukiSchedulesForAllOrganizations(): Promise<{
  ensured: number;
  created: number;
}> {
  const organizations = await db
    .select({ id: organization.id })
    .from(organization);

  let ensured = 0;
  let created = 0;

  for (const org of organizations) {
    const result = await ensureDefaultYukiSchedule({
      organizationId: org.id,
    });
    if (result) {
      ensured += 1;
      if (result.created) {
        created += 1;
      }
    }
  }

  return { ensured, created };
}

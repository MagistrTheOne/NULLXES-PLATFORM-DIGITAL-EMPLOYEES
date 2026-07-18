import "server-only";

import { and, desc, eq, inArray, ne } from "drizzle-orm";
import {
  capsuleOpenEvent,
  employeeRewardLoadout,
  rewardDefinition,
} from "@/entities/reward";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { CAPSULE_HOLDING_GRANT_SLUG } from "@/features/billing/config/capsule-pricing";
import { db } from "@/shared/db/client";
import type { HqTimelineEvent } from "../types";
import { getHqMissionSnapshot } from "./get-hq-mission-snapshot";

const FEED_LIMIT = 12;

/**
 * Floor activity: missions + capsule opens + recent equip saves.
 */
export async function getHqFloorActivity(
  organizationId: string,
): Promise<{
  opsItems: Awaited<ReturnType<typeof getHqMissionSnapshot>>["opsItems"];
  recentTimeline: HqTimelineEvent[];
  missionByEmployeeId: Awaited<
    ReturnType<typeof getHqMissionSnapshot>
  >["missionByEmployeeId"];
}> {
  const missionSnapshot = await getHqMissionSnapshot(organizationId);

  const [capsuleRows, equipRows] = await Promise.all([
    db
      .select({
        id: capsuleOpenEvent.id,
        rewardSlug: capsuleOpenEvent.rewardSlug,
        tierId: capsuleOpenEvent.tierId,
        source: capsuleOpenEvent.source,
        createdAt: capsuleOpenEvent.createdAt,
      })
      .from(capsuleOpenEvent)
      .where(
        and(
          eq(capsuleOpenEvent.organizationId, organizationId),
          ne(capsuleOpenEvent.rewardSlug, CAPSULE_HOLDING_GRANT_SLUG),
        ),
      )
      .orderBy(desc(capsuleOpenEvent.createdAt))
      .limit(8),
    db
      .select({
        id: employeeRewardLoadout.id,
        employeeId: employeeRewardLoadout.employeeId,
        employeeName: digitalEmployee.name,
        appearanceSlug: employeeRewardLoadout.appearanceSlug,
        voiceSlug: employeeRewardLoadout.voiceSlug,
        backgroundSlug: employeeRewardLoadout.backgroundSlug,
        frameSlug: employeeRewardLoadout.frameSlug,
        updatedAt: employeeRewardLoadout.updatedAt,
      })
      .from(employeeRewardLoadout)
      .innerJoin(
        digitalEmployee,
        eq(digitalEmployee.id, employeeRewardLoadout.employeeId),
      )
      .where(eq(employeeRewardLoadout.organizationId, organizationId))
      .orderBy(desc(employeeRewardLoadout.updatedAt))
      .limit(8),
  ]);

  const rewardSlugs = [
    ...new Set([
      ...capsuleRows.map((row) => row.rewardSlug),
      ...equipRows.flatMap((row) =>
        [
          row.appearanceSlug,
          row.voiceSlug,
          row.backgroundSlug,
          row.frameSlug,
        ].filter((value): value is string => Boolean(value)),
      ),
    ]),
  ];

  const defs =
    rewardSlugs.length > 0
      ? await db
          .select({
            slug: rewardDefinition.slug,
            name: rewardDefinition.name,
          })
          .from(rewardDefinition)
          .where(inArray(rewardDefinition.slug, rewardSlugs))
      : [];
  const nameBySlug = new Map(defs.map((d) => [d.slug, d.name]));

  const capsuleEvents: HqTimelineEvent[] = capsuleRows.map((row) => ({
    id: `capsule-${row.id}`,
    kind: "capsule",
    employeeId: "",
    employeeName: "Capsules",
    key: row.source,
    label: `Opened · ${nameBySlug.get(row.rewardSlug) ?? row.rewardSlug}`,
    at: row.createdAt.toISOString(),
    missionTitle: row.tierId,
    missionId: undefined,
    href: `/dashboard/inventory?item=${encodeURIComponent(row.rewardSlug)}`,
  }));

  const equipEvents: HqTimelineEvent[] = equipRows.map((row) => {
    const equipped = [
      row.appearanceSlug,
      row.voiceSlug,
      row.backgroundSlug,
      row.frameSlug,
    ].filter((value): value is string => Boolean(value));
    const primary = equipped[0];
    const label = primary
      ? `Equipped · ${nameBySlug.get(primary) ?? primary}`
      : "Loadout updated";
    return {
      id: `equip-${row.id}-${row.updatedAt.toISOString()}`,
      kind: "equip" as const,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      key: "equip",
      label,
      at: row.updatedAt.toISOString(),
      missionTitle: "",
      missionId: undefined,
      href: `/dashboard/employees/${row.employeeId}`,
    };
  });

  const missionEvents: HqTimelineEvent[] = missionSnapshot.recentTimeline.map(
    (event) => ({
      ...event,
      kind: "mission" as const,
      href: event.missionId
        ? `/dashboard/missions?mission=${event.missionId}`
        : "/dashboard/missions",
    }),
  );

  const merged = [...missionEvents, ...capsuleEvents, ...equipEvents].sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );

  return {
    opsItems: missionSnapshot.opsItems,
    recentTimeline: merged.slice(0, FEED_LIMIT),
    missionByEmployeeId: missionSnapshot.missionByEmployeeId,
  };
}

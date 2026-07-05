import { and, desc, eq, lt } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import type { AvatarProviderConfigPayload } from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { db } from "@/shared/db/client";
import type { MissionType } from "../lib/mission-type";

export type MissionListItem = {
  id: string;
  title: string;
  brief: string;
  type: MissionType;
  status:
    | "planned"
    | "working"
    | "waiting_approval"
    | "completed"
    | "failed"
    | "cancelled";
  employeeId: string;
  employeeName: string;
  employeeAvatarUrl: string | null;
  leadsCount: number;
  source: "manual" | "scheduled";
  createdAt: Date;
  updatedAt: Date;
};

function readAvatarPreviewUrl(
  config: Record<string, unknown> | null | undefined,
): string | null {
  if (!config) {
    return null;
  }

  const avatar = config as AvatarProviderConfigPayload;
  const url = avatar.previewUrl ?? avatar.imageUrl ?? null;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export async function listOrganizationMissions(
  organizationId: string,
  options?: { limit?: number; cursor?: string },
): Promise<{ items: MissionListItem[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;

  const rows = await db
    .select({
      id: employeeMission.id,
      title: employeeMission.title,
      brief: employeeMission.brief,
      type: employeeMission.type,
      status: employeeMission.status,
      employeeId: employeeMission.employeeId,
      employeeName: digitalEmployee.name,
      avatarConfig: employeeProviderConfig.config,
      leads: employeeMission.leads,
      source: employeeMission.source,
      createdAt: employeeMission.createdAt,
      updatedAt: employeeMission.updatedAt,
    })
    .from(employeeMission)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, employeeMission.employeeId),
    )
    .leftJoin(
      employeeProviderConfig,
      and(
        eq(employeeProviderConfig.employeeId, employeeMission.employeeId),
        eq(employeeProviderConfig.providerType, "avatar"),
      ),
    )
    .where(
      and(
        eq(employeeMission.organizationId, organizationId),
        options?.cursor
          ? lt(employeeMission.createdAt, new Date(options.cursor))
          : undefined,
      ),
    )
    .orderBy(desc(employeeMission.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      title: row.title,
      brief: row.brief,
      type: row.type,
      status: row.status,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      employeeAvatarUrl: readAvatarPreviewUrl(row.avatarConfig),
      leadsCount: Array.isArray(row.leads) ? row.leads.length : 0,
      source: row.source,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null,
  };
}

import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  SessionProviderConfigPayload,
} from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { db } from "@/shared/db/client";
import { isAnamAvatarTalkReady } from "../lib/resolve-anam-avatar-talk-readiness";
import { readProviderFailureReason } from "../lib/resolve-talk-readiness";
import type { EmployeeListItem } from "../types";

const DEFAULT_PAGE_SIZE = 24;

export type EmployeeListPage = {
  items: EmployeeListItem[];
  nextCursor: string | null;
};

function readProvisioningStatus(
  value: unknown,
): EmployeeListItem["avatarProvisioningStatus"] {
  if (
    value === "pending" ||
    value === "provisioning" ||
    value === "ready" ||
    value === "failed"
  ) {
    return value;
  }

  return "pending";
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAt, id] = decoded.split("|");
    if (!createdAt || !id) {
      return null;
    }

    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return { createdAt: parsed, id };
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString(
    "base64url",
  );
}

export async function listOrganizationEmployees(
  organizationId: string,
  options?: { cursor?: string; limit?: number },
): Promise<EmployeeListPage> {
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_PAGE_SIZE, 1), 100);
  const cursor = options?.cursor ? decodeCursor(options.cursor) : null;

  const employees = await db
    .select()
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        cursor
          ? or(
              lt(digitalEmployee.createdAt, cursor.createdAt),
              and(
                eq(digitalEmployee.createdAt, cursor.createdAt),
                lt(digitalEmployee.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(digitalEmployee.createdAt), desc(digitalEmployee.id))
    .limit(limit + 1);

  const pageRows = employees.slice(0, limit);
  const hasMore = employees.length > limit;

  if (pageRows.length === 0) {
    return { items: [], nextCursor: null };
  }

  const employeeIds = pageRows.map((employee) => employee.id);

  const [knowledgeCounts, providerConfigs] = await Promise.all([
    db
      .select({
        employeeId: knowledgeSource.employeeId,
        knowledgeSourcesCount: sql<number>`cast(count(*) as int)`.mapWith(
          Number,
        ),
      })
      .from(knowledgeSource)
      .where(inArray(knowledgeSource.employeeId, employeeIds))
      .groupBy(knowledgeSource.employeeId),
    db
      .select()
      .from(employeeProviderConfig)
      .where(inArray(employeeProviderConfig.employeeId, employeeIds)),
  ]);

  const countByEmployeeId = new Map(
    knowledgeCounts.map((row) => [row.employeeId, row.knowledgeSourcesCount]),
  );

  const avatarConfigByEmployee = new Map<string, AvatarProviderConfigPayload>();
  const sessionConfigByEmployee = new Map<string, SessionProviderConfigPayload>();

  for (const row of providerConfigs) {
    if (row.providerType === "avatar") {
      avatarConfigByEmployee.set(
        row.employeeId,
        row.config as AvatarProviderConfigPayload,
      );
    }

    if (row.providerType === "session") {
      sessionConfigByEmployee.set(
        row.employeeId,
        row.config as SessionProviderConfigPayload,
      );
    }
  }

  const items = pageRows.map((employee) => {
    const avatarConfig = avatarConfigByEmployee.get(employee.id);
    const sessionConfig = sessionConfigByEmployee.get(employee.id);
    const avatarProvisioningStatus = readProvisioningStatus(
      avatarConfig?.provisioningStatus,
    );
    const sessionProvisioningStatus = readProvisioningStatus(
      sessionConfig?.provisioningStatus,
    );
    const avatarReady = isAnamAvatarTalkReady(avatarConfig);
    const sessionReady = sessionProvisioningStatus === "ready";

    return {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      avatarProvider: employee.avatarProvider,
      brainProvider: employee.brainProvider,
      knowledgeSourcesCount: countByEmployeeId.get(employee.id) ?? 0,
      createdAt: employee.createdAt,
      avatarPreviewUrl: avatarConfig?.previewUrl ?? null,
      avatarProvisioningStatus,
      sessionProvisioningStatus,
      avatarProvisioningFailureReason: readProviderFailureReason(
        avatarConfig as Record<string, unknown> | undefined,
      ),
      sessionProvisioningFailureReason: readProviderFailureReason(
        sessionConfig as Record<string, unknown> | undefined,
      ),
      sessionVoiceProvider: sessionConfig?.voiceProvider ?? null,
      canTalk: avatarReady && sessionReady,
    };
  });

  const last = pageRows[pageRows.length - 1];

  return {
    items,
    nextCursor: hasMore
      ? encodeCursor(last.createdAt, last.id)
      : null,
  };
}

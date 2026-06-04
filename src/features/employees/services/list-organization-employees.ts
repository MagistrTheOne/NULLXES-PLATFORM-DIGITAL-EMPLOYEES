import { count, desc, eq, inArray } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  SessionProviderConfigPayload,
} from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { db } from "@/shared/db/client";
import type { EmployeeListItem } from "../types";

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

export async function listOrganizationEmployees(
  organizationId: string,
): Promise<EmployeeListItem[]> {
  const employees = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.organizationId, organizationId))
    .orderBy(desc(digitalEmployee.createdAt));

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((employee) => employee.id);

  const knowledgeCounts = await db
    .select({
      employeeId: knowledgeSource.employeeId,
      knowledgeSourcesCount: count(),
    })
    .from(knowledgeSource)
    .where(inArray(knowledgeSource.employeeId, employeeIds))
    .groupBy(knowledgeSource.employeeId);

  const providerConfigs = await db
    .select()
    .from(employeeProviderConfig)
    .where(inArray(employeeProviderConfig.employeeId, employeeIds));

  const countByEmployeeId = new Map(
    knowledgeCounts.map((row) => [
      row.employeeId,
      Number(row.knowledgeSourcesCount),
    ]),
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

  return employees.map((employee) => {
    const avatarConfig = avatarConfigByEmployee.get(employee.id);
    const sessionConfig = sessionConfigByEmployee.get(employee.id);
    const avatarProvisioningStatus = readProvisioningStatus(
      avatarConfig?.provisioningStatus,
    );
    const avatarReady =
      avatarProvisioningStatus === "ready" &&
      Boolean(avatarConfig?.personaId && avatarConfig?.previewUrl);
    const sessionReady = readProvisioningStatus(
      sessionConfig?.provisioningStatus,
    ) === "ready";

    return {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      status: employee.status,
      avatarProvider: employee.avatarProvider,
      brainProvider: employee.brainProvider,
      knowledgeSourcesCount: countByEmployeeId.get(employee.id) ?? 0,
      createdAt: employee.createdAt,
      avatarPreviewUrl: avatarConfig?.previewUrl ?? null,
      avatarProvisioningStatus,
      sessionVoiceProvider: sessionConfig?.voiceProvider ?? null,
      canTalk: avatarReady && sessionReady,
    };
  });
}

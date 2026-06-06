import { count, desc, eq, inArray, or, sql } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  BrainProviderConfigPayload,
  SessionProviderConfigPayload,
} from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeHandoff } from "@/entities/employee-handoff/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import type { EmployeeDetail } from "../types";

function readProvisioningStatus(
  value: unknown,
): EmployeeDetail["avatarProvisioningStatus"] {
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

export async function getEmployeeDetail(
  organizationId: string,
  employeeId: string,
): Promise<EmployeeDetail | null> {
  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee || employee.organizationId !== organizationId) {
    return null;
  }

  const [runtime] = await db
    .select()
    .from(employeeRuntime)
    .where(eq(employeeRuntime.employeeId, employeeId))
    .limit(1);

  const configs = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const [knowledgeRow] = await db
    .select({ knowledgeSourcesCount: count() })
    .from(knowledgeSource)
    .where(eq(knowledgeSource.employeeId, employeeId));

  const knowledgeRows = await db
    .select({
      id: knowledgeSource.id,
      type: knowledgeSource.type,
      title: knowledgeSource.title,
      status: knowledgeSource.status,
      failureReason: knowledgeSource.failureReason,
      createdAt: knowledgeSource.createdAt,
      chunkCount: sql<number>`cast(count(${knowledgeChunk.id}) as int)`.mapWith(
        Number,
      ),
    })
    .from(knowledgeSource)
    .leftJoin(knowledgeChunk, eq(knowledgeChunk.sourceId, knowledgeSource.id))
    .where(eq(knowledgeSource.employeeId, employeeId))
    .groupBy(knowledgeSource.id)
    .orderBy(desc(knowledgeSource.createdAt));

  const lifecycleRows = await db
    .select({
      id: employeeLifecycleEvent.id,
      eventType: employeeLifecycleEvent.eventType,
      reason: employeeLifecycleEvent.reason,
      createdAt: employeeLifecycleEvent.createdAt,
      actorName: user.name,
    })
    .from(employeeLifecycleEvent)
    .innerJoin(user, eq(employeeLifecycleEvent.actorUserId, user.id))
    .where(eq(employeeLifecycleEvent.employeeId, employeeId))
    .orderBy(desc(employeeLifecycleEvent.createdAt));

  const handoffRows = await db
    .select()
    .from(employeeHandoff)
    .where(
      or(
        eq(employeeHandoff.fromEmployeeId, employeeId),
        eq(employeeHandoff.toEmployeeId, employeeId),
      ),
    )
    .orderBy(desc(employeeHandoff.createdAt))
    .limit(20);

  const counterpartIds = [
    ...new Set(
      handoffRows.flatMap((row) =>
        row.fromEmployeeId === employeeId
          ? [row.toEmployeeId]
          : [row.fromEmployeeId],
      ),
    ),
  ];

  const counterpartRows =
    counterpartIds.length > 0
      ? await db
          .select({ id: digitalEmployee.id, name: digitalEmployee.name })
          .from(digitalEmployee)
          .where(inArray(digitalEmployee.id, counterpartIds))
      : [];

  const counterpartNameById = new Map(
    counterpartRows.map((row) => [row.id, row.name]),
  );

  const avatarConfig = configs.find((row) => row.providerType === "avatar")
    ?.config as AvatarProviderConfigPayload | undefined;
  const brainConfig = configs.find((row) => row.providerType === "brain")
    ?.config as BrainProviderConfigPayload | undefined;
  const sessionConfig = configs.find((row) => row.providerType === "session")
    ?.config as SessionProviderConfigPayload | undefined;

  const avatarProvisioningStatus = readProvisioningStatus(
    avatarConfig?.provisioningStatus,
  );
  const sessionProvisioningStatus = readProvisioningStatus(
    sessionConfig?.provisioningStatus,
  );
  const brainProvisioningStatus = readProvisioningStatus(
    brainConfig?.provisioningStatus,
  );

  const avatarReady =
    avatarProvisioningStatus === "ready" &&
    Boolean(avatarConfig?.personaId && avatarConfig?.previewUrl);

  const anamVoiceId =
    typeof avatarConfig?.providerMetadata?.anamPersonaVoiceId === "string"
      ? avatarConfig.providerMetadata.anamPersonaVoiceId
      : null;

  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    status: employee.status,
    description: employee.description,
    avatarProvider: employee.avatarProvider,
    brainProvider: employee.brainProvider,
    knowledgeSourcesCount: Number(knowledgeRow?.knowledgeSourcesCount ?? 0),
    createdAt: employee.createdAt,
    avatarPreviewUrl: avatarConfig?.previewUrl ?? null,
    avatarProvisioningStatus,
    sessionVoiceProvider: sessionConfig?.voiceProvider ?? null,
    canTalk: avatarReady && sessionProvisioningStatus === "ready",
    avatarId: avatarConfig?.avatarId ?? null,
    personaId: avatarConfig?.personaId ?? null,
    anamVoiceId,
    studioVoiceId: sessionConfig?.studioVoiceId ?? null,
    voiceId: sessionConfig?.voiceId ?? null,
    brainModel: brainConfig?.model ?? null,
    brainProvisioningStatus,
    sessionProvisioningStatus,
    systemPrompt: runtime?.systemPrompt ?? "",
    knowledge: knowledgeRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      failureReason: row.failureReason,
      chunkCount: row.chunkCount,
      createdAt: row.createdAt,
    })),
    lifecycle: lifecycleRows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      reason: row.reason,
      actorName: row.actorName,
      createdAt: row.createdAt,
    })),
    handoffs: handoffRows.map((row) => {
      const outgoing = row.fromEmployeeId === employeeId;
      const counterpartId = outgoing ? row.toEmployeeId : row.fromEmployeeId;
      return {
        id: row.id,
        direction: outgoing ? ("outgoing" as const) : ("incoming" as const),
        counterpartName:
          counterpartNameById.get(counterpartId) ?? counterpartId,
        status: row.status,
        createdAt: row.createdAt,
      };
    }),
  };
}

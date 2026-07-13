import { count, desc, eq, inArray, or, sql } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  BrainProviderConfigPayload,
  SessionProviderConfigPayload,
} from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeHandoff } from "@/entities/employee-handoff/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { user } from "@/entities/user/schema";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { db } from "@/shared/db/client";
import {
  isAnamAvatarTalkReady,
  resolveAnamPersonaVoiceId,
} from "../lib/resolve-anam-avatar-talk-readiness";
import { readProviderFailureReason } from "../lib/resolve-talk-readiness";
import { isXaiVoiceConfigured } from "@/shared/config/xai-voice-env";
import { resolveXaiVoiceConfigForEmployee } from "@/features/xai-voice/services/resolve-xai-voice-config";
import { isPlatformCatalogEmployeeVisibleToPlan } from "./platform-employee-catalog";
import type {
  EmployeeDetail,
  EmployeeDetailShell,
  EmployeeHandoffItem,
  EmployeeKnowledgeItem,
  EmployeeLifecycleItem,
} from "../types";

function readProvisioningStatus(
  value: unknown,
): EmployeeDetailShell["avatarProvisioningStatus"] {
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

export async function getEmployeeDetailShell(
  organizationId: string,
  employeeId: string,
): Promise<EmployeeDetailShell | null> {
  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    return null;
  }

  const isHomeOrg = employee.organizationId === organizationId;
  let source: "organization" | "platform" = "organization";
  if (!isHomeOrg) {
    const [callerOrg] = await db
      .select({ billingPlan: organization.billingPlan })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    const callerPlan = resolveBillingPlanId(callerOrg?.billingPlan ?? "free");
    if (!(await isPlatformCatalogEmployeeVisibleToPlan(employeeId, callerPlan))) {
      return null;
    }
    source = "platform";
  }

  const [runtime, configs, knowledgeRow, xaiVoiceConfig] = await Promise.all([
    db
      .select()
      .from(employeeRuntime)
      .where(eq(employeeRuntime.employeeId, employeeId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select()
      .from(employeeProviderConfig)
      .where(eq(employeeProviderConfig.employeeId, employeeId)),
    db
      .select({ knowledgeSourcesCount: count() })
      .from(knowledgeSource)
      .where(eq(knowledgeSource.employeeId, employeeId))
      .then((rows) => rows[0] ?? null),
    resolveXaiVoiceConfigForEmployee(employeeId),
  ]);

  const avatarConfig = configs.find((row) => row.providerType === "avatar")
    ?.config as AvatarProviderConfigPayload | undefined;
  const brainConfig = configs.find((row) => row.providerType === "brain")
    ?.config as BrainProviderConfigPayload | undefined;
  const sessionConfig = configs.find((row) => row.providerType === "session")
    ?.config as SessionProviderConfigPayload | undefined;

  const avatarReady = isAnamAvatarTalkReady(avatarConfig);
  const sessionProvisioningStatus = readProvisioningStatus(
    sessionConfig?.provisioningStatus,
  );
  const avatarProvisioningStatus = readProvisioningStatus(
    avatarConfig?.provisioningStatus,
  );

  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    department: employee.department,
    status: employee.status,
    description: employee.description,
    avatarProvider: employee.avatarProvider,
    brainProvider: employee.brainProvider,
    knowledgeSourcesCount: Number(knowledgeRow?.knowledgeSourcesCount ?? 0),
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
    canTalk: avatarReady && sessionProvisioningStatus === "ready",
    source,
    xaiVoiceAvailable: Boolean(xaiVoiceConfig),
    avatarId: avatarConfig?.avatarId ?? null,
    personaId: avatarConfig?.personaId ?? null,
    anamApiKeySlot:
      typeof avatarConfig?.providerMetadata?.anamApiKeySlot === "string"
        ? avatarConfig.providerMetadata.anamApiKeySlot
        : null,
    anamVoiceId: resolveAnamPersonaVoiceId(avatarConfig),
    voiceBinding:
      typeof avatarConfig?.providerMetadata?.voiceBinding === "string"
        ? avatarConfig.providerMetadata.voiceBinding
        : null,
    studioVoiceId: sessionConfig?.studioVoiceId ?? null,
    voiceId: sessionConfig?.voiceId ?? null,
    brainModel: brainConfig?.model ?? null,
    brainProvisioningStatus: readProvisioningStatus(
      brainConfig?.provisioningStatus,
    ),
    brainProvisioningFailureReason: readProviderFailureReason(
      brainConfig as Record<string, unknown> | undefined,
    ),
    systemPrompt: runtime?.systemPrompt ?? "",
    xaiVoiceConfigured: isXaiVoiceConfigured(),
    xaiVoiceEnabled: sessionConfig?.xaiVoiceEnabled ?? false,
    xaiVoiceInstructions: sessionConfig?.xaiVoiceInstructions?.trim() || null,
    xaiVoiceBindConsoleAgent: sessionConfig?.xaiVoiceBindConsoleAgent ?? false,
    xaiVoiceAgentId: sessionConfig?.xaiVoiceAgentId?.trim() || null,
  };
}

export async function getEmployeeDetailKnowledge(
  organizationId: string,
  employeeId: string,
): Promise<EmployeeKnowledgeItem[]> {
  const [employee] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    return [];
  }

  const rows = await db
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

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    status: row.status,
    failureReason: row.failureReason,
    chunkCount: row.chunkCount,
    createdAt: row.createdAt,
  }));
}

export async function getEmployeeDetailLifecycle(
  organizationId: string,
  employeeId: string,
): Promise<{
  lifecycle: EmployeeLifecycleItem[];
  handoffs: EmployeeHandoffItem[];
}> {
  const [employee] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    return { lifecycle: [], handoffs: [] };
  }

  const [lifecycleRows, handoffRows] = await Promise.all([
    db
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
      .orderBy(desc(employeeLifecycleEvent.createdAt)),
    db
      .select()
      .from(employeeHandoff)
      .where(
        or(
          eq(employeeHandoff.fromEmployeeId, employeeId),
          eq(employeeHandoff.toEmployeeId, employeeId),
        ),
      )
      .orderBy(desc(employeeHandoff.createdAt))
      .limit(20),
  ]);

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

  return {
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
        reason:
          typeof row.context?.reason === "string" ? row.context.reason : null,
        taskId: row.taskId ?? null,
        createdAt: row.createdAt,
      };
    }),
  };
}

export async function getEmployeeDetail(
  organizationId: string,
  employeeId: string,
): Promise<EmployeeDetail | null> {
  const shell = await getEmployeeDetailShell(organizationId, employeeId);
  if (!shell) {
    return null;
  }

  const [knowledge, lifecycleBundle] = await Promise.all([
    getEmployeeDetailKnowledge(organizationId, employeeId),
    getEmployeeDetailLifecycle(organizationId, employeeId),
  ]);

  return {
    ...shell,
    knowledge,
    lifecycle: lifecycleBundle.lifecycle,
    handoffs: lifecycleBundle.handoffs,
  };
}

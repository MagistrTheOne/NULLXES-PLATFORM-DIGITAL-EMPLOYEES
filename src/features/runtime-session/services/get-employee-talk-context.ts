import { cache } from "react";
import { eq } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  BrainProviderConfigPayload,
  SessionProviderConfigPayload,
} from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import {
  isAnamAvatarTalkReady,
  resolveAnamPersonaVoiceId,
} from "@/features/employees/lib/resolve-anam-avatar-talk-readiness";
import { getEmployeeBlueprint } from "@/features/agent-blueprint/queries/get-employee-blueprint";
import { isPlatformCatalogEmployeeVisibleToPlan } from "@/features/employees/services/platform-employee-catalog";
import { resolveXaiVoiceConfigForEmployee } from "@/features/xai-voice/services/resolve-xai-voice-config";
import type { EmployeeTalkContext } from "../types/employee-talk-context";

function readProvisioningStatus(
  value: unknown,
): EmployeeTalkContext["avatarProvisioningStatus"] {
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

async function loadEmployeeTalkContext(
  organizationId: string,
  employeeId: string,
): Promise<EmployeeTalkContext | null> {
  return withDatabaseRetry(() =>
    queryEmployeeTalkContext(organizationId, employeeId),
  );
}

async function queryEmployeeTalkContext(
  organizationId: string,
  employeeId: string,
): Promise<EmployeeTalkContext | null> {
  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    return null;
  }

  const isHomeOrg = employee.organizationId === organizationId;
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
  }

  const blueprintOrgId = employee.organizationId;

  const [runtime, configs, blueprint, xaiVoiceConfig] = await Promise.all([
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
    getEmployeeBlueprint({ organizationId: blueprintOrgId, employeeId }),
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

  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    organizationId: employee.organizationId,
    canTalk: avatarReady && sessionProvisioningStatus === "ready",
    avatarPreviewUrl: avatarConfig?.previewUrl ?? null,
    systemPrompt: runtime?.systemPrompt ?? "",
    brainProvider: employee.brainProvider,
    brainModel: brainConfig?.model ?? null,
    avatarId: avatarConfig?.avatarId ?? null,
    personaId: avatarConfig?.personaId ?? null,
    anamVoiceId: resolveAnamPersonaVoiceId(avatarConfig),
    avatarProvisioningStatus: readProvisioningStatus(
      avatarConfig?.provisioningStatus,
    ),
    avatarProviderMetadata:
      avatarConfig?.providerMetadata &&
      typeof avatarConfig.providerMetadata === "object"
        ? (avatarConfig.providerMetadata as Record<string, unknown>)
        : null,
    sessionVoiceProvider: sessionConfig?.voiceProvider ?? null,
    voiceId: sessionConfig?.voiceId ?? null,
    studioVoiceId: sessionConfig?.studioVoiceId ?? null,
    sessionProvisioningStatus,
    sessionProviderMetadata:
      sessionConfig?.providerMetadata &&
      typeof sessionConfig.providerMetadata === "object"
        ? (sessionConfig.providerMetadata as Record<string, unknown>)
        : null,
    xaiVoiceAvailable: Boolean(xaiVoiceConfig),
    temperature: runtime?.temperature ?? 0.7,
    maxTokens: runtime?.maxTokens ?? 1024,
    sessionLimitSeconds: runtime?.sessionLimitSeconds ?? 3600,
    department: employee.department,
    characterPromptBlock: blueprint.characterPromptBlock,
    activeSkills: blueprint.activeSkills,
    enabledToolSlugs: blueprint.enabledToolSlugs,
  };
}

export const getEmployeeTalkContext = cache(loadEmployeeTalkContext);

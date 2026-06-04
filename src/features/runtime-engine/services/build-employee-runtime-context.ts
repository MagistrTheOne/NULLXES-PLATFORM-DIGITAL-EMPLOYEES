import { and, asc, eq, inArray } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  BrainProviderConfigPayload,
} from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import {
  knowledgeChunk,
  knowledgeSource,
} from "@/entities/knowledge/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { db } from "@/shared/db/client";
import type {
  BuildEmployeeRuntimeContextInput,
  EmployeeRuntimeContext,
} from "../types";

function parseBrainConfig(
  config: Record<string, unknown>,
): BrainProviderConfigPayload {
  const model = config.model;
  if (typeof model !== "string" || !model) {
    throw new Error("Brain provider config is missing model");
  }

  return {
    model,
    temperature:
      typeof config.temperature === "number" ? config.temperature : undefined,
  };
}

function parseAvatarConfig(
  config: Record<string, unknown>,
): AvatarProviderConfigPayload {
  const avatarId = config.avatarId;
  if (typeof avatarId !== "string" || !avatarId) {
    throw new Error("Avatar provider config is missing avatarId");
  }

  return {
    avatarId,
    quality: typeof config.quality === "string" ? config.quality : undefined,
  };
}

export async function buildEmployeeRuntimeContext(
  input: BuildEmployeeRuntimeContextInput,
): Promise<EmployeeRuntimeContext> {
  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, input.employeeId))
    .limit(1);

  if (!employee) {
    throw new Error("Digital employee not found");
  }

  const [runtime] = await db
    .select()
    .from(employeeRuntime)
    .where(eq(employeeRuntime.employeeId, input.employeeId))
    .limit(1);

  if (!runtime) {
    throw new Error("Employee runtime not found");
  }

  const providerConfigRows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, input.employeeId));

  const brainRow = providerConfigRows.find((row) => row.providerType === "brain");
  const avatarRow = providerConfigRows.find((row) => row.providerType === "avatar");

  if (!brainRow) {
    throw new Error("Brain provider config not found for employee");
  }

  if (!avatarRow) {
    throw new Error("Avatar provider config not found for employee");
  }

  const readySources = await db
    .select()
    .from(knowledgeSource)
    .where(
      and(
        eq(knowledgeSource.employeeId, input.employeeId),
        eq(knowledgeSource.status, "ready"),
      ),
    )
    .orderBy(asc(knowledgeSource.createdAt));

  const readySourceIds = readySources.map((source) => source.id);

  const chunks =
    readySourceIds.length > 0
      ? await db
          .select()
          .from(knowledgeChunk)
          .where(inArray(knowledgeChunk.sourceId, readySourceIds))
          .orderBy(asc(knowledgeChunk.sourceId), asc(knowledgeChunk.chunkIndex))
      : [];

  return {
    employee,
    runtime,
    brainProvider: {
      providerId: brainRow.providerId,
      config: parseBrainConfig(brainRow.config),
    },
    avatarProvider: {
      providerId: avatarRow.providerId,
      config: parseAvatarConfig(avatarRow.config),
    },
    knowledge: {
      sources: readySources,
      chunks,
    },
    limits: {
      sessionLimitSeconds: runtime.sessionLimitSeconds,
      maxTokens: runtime.maxTokens,
      temperature: runtime.temperature,
      isActive: runtime.isActive,
    },
  };
}

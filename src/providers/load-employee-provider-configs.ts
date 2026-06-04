import { and, eq } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  BrainProviderConfigPayload,
} from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { db } from "@/shared/db/client";

export type EmployeeProviderConfigs = {
  brain: {
    providerId: string;
    config: BrainProviderConfigPayload;
  };
  avatar: {
    providerId: string;
    config: AvatarProviderConfigPayload;
  };
};

export async function loadEmployeeProviderConfigs(
  employeeId: string,
): Promise<EmployeeProviderConfigs> {
  const rows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const brainRow = rows.find((row) => row.providerType === "brain");
  const avatarRow = rows.find((row) => row.providerType === "avatar");

  if (!brainRow || brainRow.providerId !== "openai") {
    throw new Error("OpenAI brain provider config is missing for employee");
  }

  if (!avatarRow || avatarRow.providerId !== "anam") {
    throw new Error("Anam avatar provider config is missing for employee");
  }

  const brainConfig = brainRow.config as BrainProviderConfigPayload;
  const avatarConfig = avatarRow.config as AvatarProviderConfigPayload;

  if (!brainConfig.model) {
    throw new Error("Brain provider config is missing model");
  }

  if (!avatarConfig.avatarId) {
    throw new Error("Avatar provider config is missing avatarId");
  }

  const [runtimeConfig] = await db
    .select()
    .from(employeeRuntime)
    .where(eq(employeeRuntime.employeeId, employeeId))
    .limit(1);

  return {
    brain: {
      providerId: brainRow.providerId,
      config: {
        ...brainConfig,
        systemPrompt: runtimeConfig?.systemPrompt,
      },
    },
    avatar: {
      providerId: avatarRow.providerId,
      config: avatarConfig,
    },
  };
}

export async function getEmployeeProviderConfig(
  employeeId: string,
  providerType: "brain" | "avatar",
) {
  const [row] = await db
    .select()
    .from(employeeProviderConfig)
    .where(
      and(
        eq(employeeProviderConfig.employeeId, employeeId),
        eq(employeeProviderConfig.providerType, providerType),
      ),
    )
    .limit(1);

  return row ?? null;
}

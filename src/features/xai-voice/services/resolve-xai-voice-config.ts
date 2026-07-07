import { and, eq } from "drizzle-orm";
import type { SessionProviderConfigPayload } from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { db } from "@/shared/db/client";
import {
  ADELINE_KALEN_EMPLOYEE_ID,
  getXaiApiKey,
  readXaiVoiceAgentFromEnv,
} from "@/shared/config/xai-voice-env";

export type XaiVoiceEmployeeConfig = {
  agentId: string;
  bindConsoleAgent: boolean;
};

function readSessionXaiConfig(
  config: SessionProviderConfigPayload | undefined,
): XaiVoiceEmployeeConfig | null {
  if (!config?.xaiVoiceEnabled) {
    return null;
  }

  const agentId = config.xaiVoiceAgentId?.trim();
  if (!agentId) {
    return null;
  }

  return {
    agentId,
    bindConsoleAgent: config.xaiVoiceBindConsoleAgent !== false,
  };
}

export async function resolveXaiVoiceConfigForEmployee(
  employeeId: string,
): Promise<XaiVoiceEmployeeConfig | null> {
  if (!getXaiApiKey()) {
    return null;
  }

  const [row] = await db
    .select({ config: employeeProviderConfig.config })
    .from(employeeProviderConfig)
    .where(
      and(
        eq(employeeProviderConfig.employeeId, employeeId),
        eq(employeeProviderConfig.providerType, "session"),
      ),
    )
    .limit(1);

  const fromDb = readSessionXaiConfig(
    row?.config as SessionProviderConfigPayload | undefined,
  );
  if (fromDb) {
    return fromDb;
  }

  if (employeeId === ADELINE_KALEN_EMPLOYEE_ID) {
    const agentId = readXaiVoiceAgentFromEnv();
    if (agentId) {
      return { agentId, bindConsoleAgent: true };
    }
  }

  return null;
}

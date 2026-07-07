import { and, eq } from "drizzle-orm";
import type { SessionProviderConfigPayload } from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { db } from "@/shared/db/client";
import {
  ADELINE_KALEN_EMPLOYEE_ID,
  getXaiApiKey,
  readXaiVoiceAgentFromEnv,
} from "@/shared/config/xai-voice-env";

export type XaiVoiceConsoleConfig = {
  mode: "console";
  bindConsoleAgent: true;
  agentId: string;
  voice: string;
};

export type XaiVoicePlatformConfig = {
  mode: "platform";
  bindConsoleAgent: false;
  instructions: string | null;
  voice: string;
};

export type XaiVoiceEmployeeConfig = XaiVoiceConsoleConfig | XaiVoicePlatformConfig;

function readSessionXaiConfig(
  config: SessionProviderConfigPayload | undefined,
): XaiVoiceEmployeeConfig | null {
  if (!config?.xaiVoiceEnabled) {
    return null;
  }

  const voice = config.xaiVoiceVoice?.trim() || "eve";

  if (config.xaiVoiceBindConsoleAgent !== false) {
    const agentId = config.xaiVoiceAgentId?.trim();
    if (!agentId) {
      return null;
    }

    return {
      mode: "console",
      bindConsoleAgent: true,
      agentId,
      voice,
    };
  }

  return {
    mode: "platform",
    bindConsoleAgent: false,
    instructions: config.xaiVoiceInstructions?.trim() || null,
    voice,
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
      return {
        mode: "console",
        bindConsoleAgent: true,
        agentId,
        voice: "eve",
      };
    }
  }

  return null;
}

import { eq } from "drizzle-orm";
import type { AvatarProviderConfigPayload } from "@/entities/provider-config";
import type { SessionProviderConfigPayload } from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import {
  ANAM_API_KEY_SLOTS,
  getAnamApiKeyPool,
  type AnamApiKeySlot,
} from "@/shared/config/anam-api-pool";
import { db } from "@/shared/db/client";
import { enqueueEmployeeProvisioning } from "../orchestrator/enqueue-employee-provisioning";
import { getProviderConfigRow, mergeProviderConfig } from "./update-provider-config";

function readMetadata(
  config: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const metadata = config?.providerMetadata;
  if (metadata && typeof metadata === "object" && metadata !== null) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

export function assertAnamSlotConfigured(slot: string): AnamApiKeySlot {
  if (!ANAM_API_KEY_SLOTS.includes(slot as AnamApiKeySlot)) {
    throw new Error(`Invalid Anam slot ${slot}`);
  }

  const configured = getAnamApiKeyPool().some((entry) => entry.slot === slot);
  if (!configured) {
    throw new Error(
      `${slot} is not configured in this environment. Add it to Vercel env first.`,
    );
  }

  return slot as AnamApiKeySlot;
}

export async function repointEmployeeAnamSlot(input: {
  employeeId: string;
  slot: AnamApiKeySlot;
  enqueueProvisioning?: boolean;
}): Promise<{
  employeeId: string;
  employeeName: string;
  slot: AnamApiKeySlot;
  previousSlot: string | null;
}> {
  const slot = assertAnamSlotConfigured(input.slot);

  const avatarRow = await getProviderConfigRow(input.employeeId, "avatar");
  if (!avatarRow || avatarRow.providerId !== "anam") {
    throw new Error("Employee does not use Anam avatar provider");
  }

  const avatarConfig = avatarRow.config as AvatarProviderConfigPayload;
  const metadata = readMetadata(avatarConfig as Record<string, unknown>);
  const previousSlot =
    typeof metadata.anamApiKeySlot === "string" ? metadata.anamApiKeySlot : null;

  const [employeeRow] = await db
    .select({ name: digitalEmployee.name })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, input.employeeId))
    .limit(1);

  if (!employeeRow) {
    throw new Error("Employee not found");
  }

  await mergeProviderConfig(input.employeeId, "avatar", {
    provisioningStatus: "pending",
    personaId: undefined,
    avatarId: undefined,
    previewUrl: undefined,
    failureReason: undefined,
    providerMetadata: {
      ...metadata,
      anamApiKeySlot: slot,
      repointedAt: new Date().toISOString(),
      repointedFromSlot: previousSlot,
      repointReason: "admin_slot_pin",
    },
  });

  const sessionRow = await getProviderConfigRow(input.employeeId, "session");
  if (sessionRow) {
    const sessionConfig = sessionRow.config as SessionProviderConfigPayload;
    if (sessionConfig.provisioningStatus === "failed") {
      await mergeProviderConfig(input.employeeId, "session", {
        provisioningStatus: "pending",
        failureReason: undefined,
      });
    }
  }

  if (input.enqueueProvisioning) {
    enqueueEmployeeProvisioning(input.employeeId);
  }

  return {
    employeeId: input.employeeId,
    employeeName: employeeRow.name,
    slot,
    previousSlot,
  };
}

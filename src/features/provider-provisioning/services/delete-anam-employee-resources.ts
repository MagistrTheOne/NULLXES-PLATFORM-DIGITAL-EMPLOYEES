import type { AvatarProviderConfigPayload } from "@/entities/provider-config";
import {
  anamFetchWithKeyPool,
  readAnamErrorMessage,
} from "@/shared/config/provider-env";
import { logServerEvent } from "@/shared/lib/server-log";
import { getProviderConfigRow } from "./update-provider-config";

function isCustomAnamAvatar(config: AvatarProviderConfigPayload): boolean {
  return Boolean(config.imageUrl?.trim() || config.photoFileName?.trim());
}

async function deleteAnamResource(input: {
  path: string;
  preferredSlot?: string | null;
  resourceLabel: string;
  employeeId: string;
}): Promise<void> {
  try {
    const { response } = await anamFetchWithKeyPool(
      input.path,
      { method: "DELETE" },
      input.preferredSlot,
    );

    if (response.ok || response.status === 404) {
      return;
    }

    const detail = await readAnamErrorMessage(response);
    logServerEvent(
      "employee.anam_cleanup.failed",
      {
        employeeId: input.employeeId,
        resource: input.resourceLabel,
        status: response.status,
        detail,
      },
      "warn",
    );
  } catch (error: unknown) {
    logServerEvent(
      "employee.anam_cleanup.failed",
      {
        employeeId: input.employeeId,
        resource: input.resourceLabel,
        message: error instanceof Error ? error.message : "unknown",
      },
      "warn",
    );
  }
}

export async function deleteAnamEmployeeResources(input: {
  employeeId: string;
  avatarProvider: string;
}): Promise<void> {
  if (input.avatarProvider !== "anam") {
    return;
  }

  const row = await getProviderConfigRow(input.employeeId, "avatar");
  if (!row) {
    return;
  }

  const config = row.config as AvatarProviderConfigPayload;
  const metadata = config.providerMetadata ?? {};
  const preferredSlot =
    typeof metadata.anamApiKeySlot === "string" ? metadata.anamApiKeySlot : null;

  if (config.personaId) {
    await deleteAnamResource({
      path: `/personas/${encodeURIComponent(config.personaId)}`,
      preferredSlot,
      resourceLabel: "persona",
      employeeId: input.employeeId,
    });
  }

  if (config.avatarId && isCustomAnamAvatar(config)) {
    await deleteAnamResource({
      path: `/avatars/${encodeURIComponent(config.avatarId)}`,
      preferredSlot,
      resourceLabel: "avatar",
      employeeId: input.employeeId,
    });
  }
}

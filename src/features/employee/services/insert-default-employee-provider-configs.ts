import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import type { AvatarProvider, BrainProvider } from "@/entities/digital-employee";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";
import { db } from "@/shared/db/client";

export async function insertDefaultEmployeeProviderConfigs(input: {
  employeeId: string;
  avatarProvider?: AvatarProvider;
  brainProvider?: BrainProvider;
  organizationId: string;
}): Promise<void> {
  const settings = await ensureOrganizationSettings(input.organizationId);
  const avatarProvider = input.avatarProvider ?? "anam";
  const brainProvider = input.brainProvider ?? settings.defaultBrainProvider;
  const brainModel = resolveBrainModelForProvider(
    brainProvider,
    settings.defaultBrainModel,
  );

  await db.insert(employeeProviderConfig).values([
    {
      employeeId: input.employeeId,
      providerType: "avatar",
      providerId: avatarProvider,
      config: {
        provisioningStatus: "pending",
      },
    },
    {
      employeeId: input.employeeId,
      providerType: "brain",
      providerId: brainProvider,
      config: {
        model: brainModel,
        provisioningStatus: "pending",
      },
    },
    {
      employeeId: input.employeeId,
      providerType: "session",
      providerId: "elevenlabs",
      config: {
        voiceProvider: "elevenlabs",
        provisioningStatus: "pending",
      },
    },
  ]);
}

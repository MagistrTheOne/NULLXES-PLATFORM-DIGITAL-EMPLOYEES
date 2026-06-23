import { eq } from "drizzle-orm";
import type { BrainProvider } from "@/entities/digital-employee";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { db } from "@/shared/db/client";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";

export type OrganizationBrainDefaults = {
  defaultBrainProvider: BrainProvider;
  defaultBrainModel: string;
};

export async function getOrganizationBrainDefaults(
  organizationId: string,
): Promise<OrganizationBrainDefaults> {
  const [settings] = await db
    .select({
      defaultBrainProvider: organizationSettings.defaultBrainProvider,
      defaultBrainModel: organizationSettings.defaultBrainModel,
    })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);

  const defaultBrainProvider = settings?.defaultBrainProvider ?? "openai";
  const defaultBrainModel = resolveBrainModelForProvider(
    defaultBrainProvider,
    settings?.defaultBrainModel,
  );

  return {
    defaultBrainProvider,
    defaultBrainModel,
  };
}

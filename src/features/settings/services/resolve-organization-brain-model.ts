import { eq } from "drizzle-orm";
import type { BrainProvider } from "@/entities/digital-employee";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { db } from "@/shared/db/client";
import {
  resolveBrainModelForProvider,
} from "../lib/brain-model-defaults";

export async function resolveOrganizationBrainModel(
  organizationId: string,
  provider: BrainProvider,
): Promise<string> {
  const [settings] = await db
    .select({
      defaultBrainModel: organizationSettings.defaultBrainModel,
    })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);

  return resolveBrainModelForProvider(provider, settings?.defaultBrainModel);
}

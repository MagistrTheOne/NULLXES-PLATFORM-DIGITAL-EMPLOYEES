import { eq } from "drizzle-orm";
import type { BrainProvider } from "@/entities/digital-employee";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { db } from "@/shared/db/client";
import type { OrganizationSettingsDto } from "../types";

export type OrganizationSettingsPatch = Partial<
  Omit<OrganizationSettingsDto, "outboundWebhookConfigured">
> & {
  outboundWebhookSecret?: string | null;
};

export type UpdateOrganizationSettingsInput = {
  organizationId: string;
  settings: OrganizationSettingsPatch;
};

export async function updateOrganizationSettings(
  input: UpdateOrganizationSettingsInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { outboundWebhookConfigured: _ignored, ...patch } =
    input.settings as OrganizationSettingsPatch & {
      outboundWebhookConfigured?: boolean;
    };

  const [updated] = await db
    .update(organizationSettings)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(organizationSettings.organizationId, input.organizationId))
    .returning({ organizationId: organizationSettings.organizationId });

  if (!updated) {
    return { ok: false, message: "Organization settings were not found." };
  }

  return { ok: true };
}

export function parseBrainProvider(value: string): BrainProvider | null {
  if (
    value === "openai" ||
    value === "anthropic" ||
    value === "google" ||
    value === "nullxes" ||
    value === "xai"
  ) {
    return value;
  }

  return null;
}

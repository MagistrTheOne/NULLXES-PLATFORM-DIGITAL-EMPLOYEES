import "server-only";

import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { getProviderConfigRow, mergeProviderConfig } from "@/features/provider-provisioning/services/update-provider-config";
import { buildAnamPersonaCreatePayload } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import {
  anamFetchWithKeyPool,
  getAnamApiKeyBySlot,
  type AnamApiKeySlot,
} from "@/shared/config/anam-api-pool";
import { getAnamApiBaseUrl } from "@/shared/config/provider-env";
import { db } from "@/shared/db/client";

/**
 * Landing-only: if Anna's stored one-shot avatar was deleted on Anam, recreate
 * it from previewUrl on her pinned lab key before minting a Talk token.
 * Does not change dashboard session limits.
 */
export async function ensureLandingDemoAnamAvatar(input: {
  employeeId: string;
}): Promise<{ repaired: boolean; avatarId: string | null }> {
  const avatarRow = await getProviderConfigRow(input.employeeId, "avatar");
  if (!avatarRow || avatarRow.providerId !== "anam") {
    return { repaired: false, avatarId: null };
  }

  const config = avatarRow.config as Record<string, unknown>;
  const metadata =
    config.providerMetadata && typeof config.providerMetadata === "object"
      ? (config.providerMetadata as Record<string, unknown>)
      : {};

  const avatarId =
    typeof config.avatarId === "string" ? config.avatarId.trim() : "";
  const slot =
    typeof metadata.anamApiKeySlot === "string"
      ? (metadata.anamApiKeySlot as AnamApiKeySlot)
      : ("ANAM_API_KEY_2" as AnamApiKeySlot);
  const apiKey = getAnamApiKeyBySlot(slot);
  if (!apiKey || !avatarId) {
    return { repaired: false, avatarId: avatarId || null };
  }

  const probe = await fetch(`${getAnamApiBaseUrl()}/avatars/${avatarId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (probe.ok) {
    return { repaired: false, avatarId };
  }

  const previewUrl =
    (typeof config.previewUrl === "string" && config.previewUrl.trim()) ||
    (typeof config.imageUrl === "string" && config.imageUrl.trim()) ||
    "";
  const voiceId =
    (typeof metadata.anamPersonaVoiceId === "string" &&
      metadata.anamPersonaVoiceId.trim()) ||
    (typeof metadata.voiceId === "string" && metadata.voiceId.trim()) ||
    "";

  if (!previewUrl || !voiceId) {
    throw new Error(
      "Landing demo avatar missing on Anam and no previewUrl/voiceId to recreate.",
    );
  }

  const [employee] = await db
    .select({ name: digitalEmployee.name })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, input.employeeId))
    .limit(1);

  const name = employee?.name?.trim() || "ANNA MARIA NULLXES";

  const { response: avatarResponse, slot: usedSlot } = await anamFetchWithKeyPool(
    "/avatars",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: name,
        imageUrl: previewUrl,
      }),
    },
    slot,
  );

  const createdAvatar = (await avatarResponse.json()) as { id?: string };
  if (!createdAvatar.id) {
    throw new Error("Landing demo avatar recreate returned no id");
  }

  const { response: personaResponse, slot: personaSlot } =
    await anamFetchWithKeyPool(
      "/personas",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildAnamPersonaCreatePayload({
            name,
            avatarId: createdAvatar.id,
            voiceId,
          }),
        ),
      },
      usedSlot,
    );

  const createdPersona = (await personaResponse.json()) as { id?: string };
  if (!createdPersona.id) {
    throw new Error("Landing demo persona recreate returned no id");
  }

  await mergeProviderConfig(
    input.employeeId,
    "avatar",
    {
      avatarId: createdAvatar.id,
      personaId: createdPersona.id,
      provisioningStatus: "ready",
      failureReason: undefined,
      providerMetadata: {
        ...metadata,
        avatarId: createdAvatar.id,
        anamApiKeySlot: personaSlot,
        anamPersonaVoiceId: voiceId,
        voiceId,
        llmId: metadata.llmId ?? "CUSTOMER_CLIENT_V1",
        resourceType: "anam_persona",
        provisionedAt: new Date().toISOString(),
        repairedAt: new Date().toISOString(),
        repairReason: "landing_avatar_missing_404",
      },
    },
    { allowCatalogMutation: true },
  );

  return { repaired: true, avatarId: createdAvatar.id };
}

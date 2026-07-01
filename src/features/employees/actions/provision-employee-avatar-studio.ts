"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  SessionProviderConfigPayload,
} from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { buildStudioDraft } from "@/features/employees/actions/build-studio-draft";
import { finalizeEmployeeStudio } from "@/features/employees/actions/finalize-employee-studio";
import { enqueueEmployeeProvisioning } from "@/features/provider-provisioning/orchestrator/enqueue-employee-provisioning";
import { db } from "@/shared/db/client";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import { getProviderConfigRow, mergeProviderConfig } from "@/features/provider-provisioning/services/update-provider-config";

export type ProvisionEmployeeAvatarStudioResult =
  | { ok: true; employeeId: string }
  | { ok: false; message: string };

export async function provisionEmployeeAvatarStudio(
  employeeId: string,
  formData: FormData,
): Promise<ProvisionEmployeeAvatarStudioResult> {
  const avatarRow = await getProviderConfigRow(employeeId, "avatar");
  const existingAvatarConfig = avatarRow?.config as
    | AvatarProviderConfigPayload
    | undefined;
  const pinnedSlot =
    typeof existingAvatarConfig?.providerMetadata?.anamApiKeySlot === "string"
      ? (existingAvatarConfig.providerMetadata.anamApiKeySlot as AnamApiKeySlot)
      : null;

  const studio = await finalizeEmployeeStudio(formData, {
    employeeId,
    preferredAnamSlot: pinnedSlot,
  });

  if (studio.status === "failed") {
    await mergeProviderConfig(employeeId, "avatar", {
      provisioningStatus: "failed",
      failureReason: studio.message,
      providerMetadata: { failedAt: new Date().toISOString() },
    });
    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${employeeId}`);
    return { ok: false, message: studio.message };
  }

  const [runtime] = await db
    .select()
    .from(employeeRuntime)
    .where(eq(employeeRuntime.employeeId, employeeId))
    .limit(1);

  if (!runtime) {
    return { ok: false, message: "Employee runtime not found" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const photoFileNameRaw = String(formData.get("photoFileName") ?? "").trim();
  const photoFileSizeRaw = String(formData.get("photoFileSize") ?? "").trim();
  const photoFileSize = photoFileSizeRaw ? Number(photoFileSizeRaw) : null;
  const brainProvider = runtime.brainProvider;

  const draft = buildStudioDraft({
    studio,
    name,
    role,
    photoFileName: photoFileNameRaw || null,
    photoFileSize: Number.isFinite(photoFileSize) ? photoFileSize : null,
    brainProvider,
    knowledge: [],
  });

  const studioProvisionedAt = new Date().toISOString();

  const avatarConfig: AvatarProviderConfigPayload = {
    avatarId: draft.avatar.avatarId,
    personaId: draft.avatar.personaId,
    previewUrl: draft.avatar.previewUrl,
    photoFileName: draft.avatar.photoFileName ?? undefined,
    photoFileSize: draft.avatar.photoFileSize ?? undefined,
    displayName: draft.identity.name,
    provisioningStatus: "ready",
    providerMetadata: {
      source: "studio",
      provisionedAt: studioProvisionedAt,
      voiceBinding: draft.avatar.voiceBinding,
      anamPersonaVoiceId: draft.avatar.anamPersonaVoiceId,
      anamApiKeySlot: studio.anamApiKeySlot,
    },
  };

  const sessionConfig: SessionProviderConfigPayload = {
    voiceProvider: draft.voice.provider,
    voiceId: draft.voice.voiceId,
    modelId: draft.voice.model ?? undefined,
    studioVoiceId: draft.voice.studioVoiceId,
    providerResourceId: draft.voice.voiceId,
    provisioningStatus: "ready",
    providerMetadata: {
      source: "studio",
      provisionedAt: studioProvisionedAt,
      voiceBinding: draft.avatar.voiceBinding,
    },
  };

  await mergeProviderConfig(employeeId, "avatar", avatarConfig);
  await mergeProviderConfig(employeeId, "session", sessionConfig);

  enqueueEmployeeProvisioning(employeeId);

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);

  return { ok: true, employeeId };
}

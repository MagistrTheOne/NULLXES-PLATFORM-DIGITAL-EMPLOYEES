"use server";

import { assertAvatarStudioSelection } from "@/features/billing/services/assert-avatar-studio-selection";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { checkForeignDataProcessingAllowed } from "@/features/privacy/services/assert-foreign-data-processing";
import { createAnamAvatarFromFile } from "@/features/employees/studio/anam-create-avatar-from-file";
import { resolveStudioAvatarPreset } from "@/features/employees/studio/avatar/list-studio-avatar-presets";
import { resolveAnamPersonaVoiceId } from "@/features/employees/studio/resolve-anam-persona-voice";
import {
  resolveStudioVoiceSelection,
} from "@/features/employees/studio/voice/voice-catalog";
import { isAnamSlotAtPersonaCapacity } from "@/features/provider-provisioning/services/resolve-anam-persona-slot";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import { buildAnamPersonaCreatePayload } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import {
  anamFetchWithKeyPool,
  hasAnamCredentials,
  readAnamErrorMessage,
} from "@/shared/config/provider-env";

export type FinalizeEmployeeStudioSuccess = {
  status: "ready";
  avatarId: string;
  previewUrl: string;
  personaId: string;
  provider: "anam";
  anamApiKeySlot: AnamApiKeySlot;
  voice: {
    studioVoiceId: string;
    provider: "anam" | "elevenlabs";
    voiceId: string;
    model: "eleven_v3" | null;
    anamPersonaVoiceId: string;
    voiceBinding: "anam" | "elevenlabs_shell";
  };
};

export type FinalizeEmployeeStudioFailure = {
  status: "failed";
  message: string;
};

export type FinalizeEmployeeStudioResult =
  | FinalizeEmployeeStudioSuccess
  | FinalizeEmployeeStudioFailure;

type AnamPersonaResponse = {
  id?: string;
};

async function createAnamPersona(input: {
  name: string;
  role: string;
  avatarId: string;
  anamVoiceId: string;
  anamApiKeySlot: AnamApiKeySlot;
}): Promise<{ personaId: string; anamApiKeySlot: AnamApiKeySlot }> {
  const { response, slot } = await anamFetchWithKeyPool(
    "/personas",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildAnamPersonaCreatePayload({
          name: input.name,
          avatarId: input.avatarId,
          voiceId: input.anamVoiceId,
        }),
      ),
    },
    input.anamApiKeySlot,
  );

  if (!response.ok) {
    const detail = await readAnamErrorMessage(response);
    throw new Error(`Anam persona creation failed with status ${response.status}: ${detail}`);
  }

  const persona = (await response.json()) as AnamPersonaResponse;
  if (!persona.id) {
    throw new Error("Anam persona creation returned an invalid response");
  }

  return { personaId: persona.id, anamApiKeySlot: slot };
}

export async function finalizeEmployeeStudio(
  formData: FormData,
): Promise<FinalizeEmployeeStudioResult> {
  let workspace;
  try {
    workspace = await requireWorkspacePermissionOrThrowMessage("canManageEmployees");
  } catch (error: unknown) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Access denied",
    };
  }

  if (!hasAnamCredentials()) {
    return { status: "failed", message: "ANAM_API_KEY is not configured" };
  }

  const anamRegionCheck = await checkForeignDataProcessingAllowed(
    workspace.organization.id,
    "anam",
  );
  if (!anamRegionCheck.allowed) {
    return { status: "failed", message: anamRegionCheck.message };
  }

  const billingPlan = resolveBillingPlanId(workspace.organization.billingPlan);
  const file = formData.get("file");
  const presetAvatarId = String(formData.get("presetAvatarId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const studioVoiceId = String(formData.get("studioVoiceId") ?? "").trim();
  const customElevenLabsVoiceId = String(
    formData.get("customElevenLabsVoiceId") ?? "",
  ).trim();

  if (!name || !role) {
    return { status: "failed", message: "Employee name and role are required" };
  }

  const selectedVoice = resolveStudioVoiceSelection(
    studioVoiceId,
    customElevenLabsVoiceId,
  );
  if (!selectedVoice) {
    return {
      status: "failed",
      message:
        studioVoiceId && customElevenLabsVoiceId
          ? "Custom ElevenLabs voice ID is invalid"
          : "Selected voice is invalid",
    };
  }

  const selectionCheck = assertAvatarStudioSelection(billingPlan, {
    presetAvatarId,
    hasPhotoFile: file instanceof File,
  });

  if (!selectionCheck.ok) {
    return { status: "failed", message: selectionCheck.message };
  }

  if (selectedVoice.provider === "ElevenLabs") {
    const elevenLabsCheck = await checkForeignDataProcessingAllowed(
      workspace.organization.id,
      "elevenlabs",
    );
    if (!elevenLabsCheck.allowed) {
      return { status: "failed", message: elevenLabsCheck.message };
    }
  }

  try {
    const avatar =
      selectionCheck.mode === "preset"
        ? await resolveStudioAvatarPreset(presetAvatarId)
        : await createAnamAvatarFromFile({ file: file as File, displayName: name });

    if (await isAnamSlotAtPersonaCapacity(avatar.anamApiKeySlot)) {
      return {
        status: "failed",
        message:
          "This Anam lab key already has a persona. Upload a custom photo to use a free key, or remove another employee from this lab.",
      };
    }

    const { anamVoiceId, binding } = await resolveAnamPersonaVoiceId(selectedVoice);
    const persona = await createAnamPersona({
      name,
      role,
      avatarId: avatar.avatarId,
      anamVoiceId,
      anamApiKeySlot: avatar.anamApiKeySlot,
    });

    const sessionVoiceId =
      selectedVoice.provider === "ElevenLabs"
        ? selectedVoice.elevenLabsVoiceId!
        : selectedVoice.anamVoiceId!;

    return {
      status: "ready",
      avatarId: avatar.avatarId,
      previewUrl: avatar.previewUrl,
      personaId: persona.personaId,
      provider: "anam",
      anamApiKeySlot: persona.anamApiKeySlot,
      voice: {
        studioVoiceId,
        provider: selectedVoice.provider === "Anam" ? "anam" : "elevenlabs",
        voiceId: sessionVoiceId,
        model: selectedVoice.provider === "ElevenLabs" ? "eleven_v3" : null,
        anamPersonaVoiceId: anamVoiceId,
        voiceBinding: binding,
      },
    };
  } catch (error) {
    return {
      status: "failed",
      message:
        error instanceof Error ? error.message : "Studio finalization failed",
    };
  }
}

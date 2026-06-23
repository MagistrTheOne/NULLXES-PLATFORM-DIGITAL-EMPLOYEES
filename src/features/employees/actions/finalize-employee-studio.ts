"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { createAnamAvatarFromFile } from "@/features/employees/studio/anam-create-avatar-from-file";
import { resolveAnamPersonaVoiceId } from "@/features/employees/studio/resolve-anam-persona-voice";
import {
  resolveStudioVoiceSelection,
} from "@/features/employees/studio/voice/voice-catalog";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import { buildAnamPersonaCreatePayload } from "@/features/runtime-session/lib/build-anam-talk-persona-config";
import {
  anamFetchWithSlot,
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
}): Promise<string> {
  const response = await anamFetchWithSlot(
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

  return persona.id;
}

export async function finalizeEmployeeStudio(
  formData: FormData,
): Promise<FinalizeEmployeeStudioResult> {
  try {
    await requireWorkspacePermissionOrThrowMessage("canManageEmployees");
  } catch (error: unknown) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Access denied",
    };
  }

  if (!hasAnamCredentials()) {
    return { status: "failed", message: "ANAM_API_KEY is not configured" };
  }

  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const studioVoiceId = String(formData.get("studioVoiceId") ?? "").trim();
  const customElevenLabsVoiceId = String(
    formData.get("customElevenLabsVoiceId") ?? "",
  ).trim();

  if (!(file instanceof File)) {
    return { status: "failed", message: "Photo file is required" };
  }

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

  try {
    const avatar = await createAnamAvatarFromFile({ file, displayName: name });
    const { anamVoiceId, binding } = await resolveAnamPersonaVoiceId(selectedVoice);
    const personaId = await createAnamPersona({
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
      personaId,
      provider: "anam",
      anamApiKeySlot: avatar.anamApiKeySlot,
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

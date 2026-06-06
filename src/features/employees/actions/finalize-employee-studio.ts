"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { createAnamAvatarFromFile } from "@/features/employees/studio/anam-create-avatar-from-file";
import { resolveAnamPersonaVoiceId } from "@/features/employees/studio/resolve-anam-persona-voice";
import {
  getStudioVoiceById,
  type StudioVoiceProvider,
} from "@/features/employees/studio/voice/voice-catalog";
import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";
import {
  getAnamApiBaseUrl,
  getAnamApiKey,
  hasAnamCredentials,
} from "@/shared/config/provider-env";

export type FinalizeEmployeeStudioSuccess = {
  status: "ready";
  avatarId: string;
  previewUrl: string;
  personaId: string;
  provider: "anam";
  voice: {
    studioVoiceId: string;
    provider: Lowercase<StudioVoiceProvider>;
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

function buildSystemPrompt(name: string, role: string): string {
  return `You are ${name}, a ${role}. Operate professionally within your organization's digital workforce.`;
}

async function createAnamPersona(input: {
  name: string;
  role: string;
  avatarId: string;
  anamVoiceId: string;
}): Promise<string> {
  const apiKey = getAnamApiKey();
  if (!apiKey) {
    throw new Error("ANAM_API_KEY is not configured");
  }

  const response = await fetch(`${getAnamApiBaseUrl()}/personas`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      description: `${input.name} NULLXES digital employee persona`,
      avatarId: input.avatarId,
      voiceId: input.anamVoiceId,
      llmId: ANAM_EXTERNAL_LLM_ID,
      systemPrompt: buildSystemPrompt(input.name, input.role),
    }),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = (await response.json()) as { message?: string };
      detail = payload.message ?? detail;
    } catch {
      // ignore parse errors
    }
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

  const selectedVoice = getStudioVoiceById(studioVoiceId, customElevenLabsVoiceId);
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

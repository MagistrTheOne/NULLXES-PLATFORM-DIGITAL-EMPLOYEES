"use server";

import { createEmployeeRecord } from "./create-employee-record";
import { provisionEmployeeAvatarStudio } from "./provision-employee-avatar-studio";
import { parseKnowledgeDraftJson } from "./build-studio-draft";
import type { BrainProvider } from "@/entities/digital-employee";
import type { StudioVoiceProviderType } from "@/features/employees/create/types";
import { getStudioVoiceById } from "@/features/employees/studio/voice/voice-catalog";

export type CreateEmployeeFromStudioWizardResult =
  | { ok: true; employeeId: string }
  | { ok: false; phase: "studio" | "persist"; message: string };

/**
 * @deprecated Prefer createEmployeeRecord + provisionEmployeeAvatarStudio for decoupled jobs.
 */
export async function createEmployeeFromStudioWizard(
  formData: FormData,
): Promise<CreateEmployeeFromStudioWizardResult> {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const studioVoiceId = String(formData.get("studioVoiceId") ?? "").trim();
  const customElevenLabsVoiceId = String(
    formData.get("customElevenLabsVoiceId") ?? "",
  ).trim();
  const brainProvider = (String(formData.get("brainProvider") ?? "openai").trim() ||
    "openai") as BrainProvider;
  const brainModel = String(formData.get("brainModel") ?? "").trim() || undefined;

  const voice = getStudioVoiceById(studioVoiceId, customElevenLabsVoiceId);
  if (!voice) {
    return { ok: false, phase: "studio", message: "Selected voice is invalid" };
  }

  const created = await createEmployeeRecord({
    name,
    role,
    brainMode: "custom",
    brainProvider,
    brainModel,
    studioVoiceId,
    customElevenLabsVoiceId: customElevenLabsVoiceId || undefined,
    voiceProvider:
      voice.provider === "Anam" ? "anam" : ("elevenlabs" as StudioVoiceProviderType),
    photoFileName: String(formData.get("photoFileName") ?? "").trim() || null,
    photoFileSize: Number(String(formData.get("photoFileSize") ?? "")) || null,
    knowledge: parseKnowledgeDraftJson(String(formData.get("knowledge") ?? "")),
  });

  if (!created.ok) {
    return { ok: false, phase: "persist", message: created.message };
  }

  const provisioned = await provisionEmployeeAvatarStudio(
    created.employeeId,
    formData,
  );

  if (!provisioned.ok) {
    return { ok: false, phase: "studio", message: provisioned.message };
  }

  return { ok: true, employeeId: created.employeeId };
}

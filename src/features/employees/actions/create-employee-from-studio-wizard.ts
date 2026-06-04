"use server";

import { revalidatePath } from "next/cache";
import type { BrainProvider } from "@/entities/digital-employee";
import {
  buildStudioDraft,
  parseKnowledgeDraftJson,
} from "./build-studio-draft";
import { finalizeEmployeeStudio } from "./finalize-employee-studio";
import {
  assertEmployeePersisted,
  persistDigitalEmployeeFromDraft,
} from "./persist-digital-employee-from-draft";

export type CreateEmployeeFromStudioWizardResult =
  | { ok: true; employeeId: string }
  | { ok: false; phase: "studio" | "persist"; message: string };

export async function createEmployeeFromStudioWizard(
  formData: FormData,
): Promise<CreateEmployeeFromStudioWizardResult> {
  const studio = await finalizeEmployeeStudio(formData);

  if (studio.status === "failed") {
    return { ok: false, phase: "studio", message: studio.message };
  }

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const photoFileNameRaw = String(formData.get("photoFileName") ?? "").trim();
  const photoFileSizeRaw = String(formData.get("photoFileSize") ?? "").trim();
  const brainProvider = (String(formData.get("brainProvider") ?? "openai").trim() ||
    "openai") as BrainProvider;

  const photoFileSize = photoFileSizeRaw ? Number(photoFileSizeRaw) : null;

  const draft = buildStudioDraft({
    studio,
    name,
    role,
    photoFileName: photoFileNameRaw || null,
    photoFileSize: Number.isFinite(photoFileSize) ? photoFileSize : null,
    brainProvider,
    knowledge: parseKnowledgeDraftJson(
      String(formData.get("knowledge") ?? ""),
    ),
  });

  try {
    const { employeeId } = await persistDigitalEmployeeFromDraft(draft);
    await assertEmployeePersisted(employeeId);
    revalidatePath("/dashboard/employees");
    return { ok: true, employeeId };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save digital employee to the database";
    console.error("createEmployeeFromStudioWizard persist failed:", message);
    return { ok: false, phase: "persist", message };
  }
}

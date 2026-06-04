import {
  assembleCreateEmployeeDraft,
  canAssembleCreateEmployeeDraft,
} from "@/features/employees/create/assemble-create-employee-draft";
import { createInitialFormState } from "@/features/employees/create/constants";
import type { CreateEmployeeDraftPayload } from "@/features/employees/create/types";

function buildStudioPersistConfig(draft: CreateEmployeeDraftPayload) {
  return {
    avatar: {
      providerId: draft.avatar.provider,
      config: {
        avatarId: draft.avatar.avatarId,
        personaId: draft.avatar.personaId,
        previewUrl: draft.avatar.previewUrl,
        provisioningStatus: "ready",
        providerMetadata: {
          source: "studio",
          voiceBinding: draft.avatar.voiceBinding,
          anamPersonaVoiceId: draft.avatar.anamPersonaVoiceId,
        },
      },
    },
    session: {
      providerId: draft.voice.provider,
      config: {
        voiceProvider: draft.voice.provider,
        voiceId: draft.voice.voiceId,
        modelId: draft.voice.model,
        studioVoiceId: draft.voice.studioVoiceId,
        provisioningStatus: "ready",
      },
    },
  };
}

function verifyEmployeeStudio(): void {
  const form = createInitialFormState();
  form.name = "Kaira";
  form.role = "Customer Support Employee";
  form.avatarId = "studio-avatar-001";
  form.avatarPreviewUrl = "https://cdn.nullxes.local/kaira.png";
  form.personaId = "studio-persona-001";
  form.studioVoiceId = "anam-lucy";
  form.voiceId = "de23e340-1416-4dd8-977d-065a7ca11697";
  form.voiceName = "Lucy";
  form.voiceProvider = "anam";
  form.voiceModel = null;
  form.voiceBinding = "anam";
  form.anamPersonaVoiceId = "de23e340-1416-4dd8-977d-065a7ca11697";

  if (!canAssembleCreateEmployeeDraft(form)) {
    throw new Error("Studio draft readiness check failed");
  }

  const draft = assembleCreateEmployeeDraft(form);
  const persistConfig = buildStudioPersistConfig(draft);

  if (persistConfig.avatar.config.personaId !== "studio-persona-001") {
    throw new Error("Persona persist mapping failed");
  }

  if (persistConfig.session.config.voiceProvider !== "anam") {
    throw new Error("Anam voice provider persist mapping failed");
  }

  console.log("Employee studio verification: OK");
}

verifyEmployeeStudio();

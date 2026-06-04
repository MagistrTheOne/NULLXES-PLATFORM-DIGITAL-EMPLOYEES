import { assembleCreateEmployeeDraft } from "@/features/employees/create/assemble-create-employee-draft";
import { createInitialFormState } from "@/features/employees/create/constants";
import type { CreateEmployeeDraftPayload } from "@/features/employees/create/types";

function buildStudioPersistConfig(draft: CreateEmployeeDraftPayload) {
  return {
    avatar: {
      providerId: draft.avatar.provider,
      config: {
        avatarId: draft.avatar.avatarId,
        previewUrl: draft.avatar.previewUrl,
        photoFileName: draft.avatar.photoFileName,
        photoFileSize: draft.avatar.photoFileSize,
        provisioningStatus: "ready",
        providerMetadata: { source: "studio" },
      },
    },
    session: {
      providerId: draft.voice.provider,
      config: {
        voiceProvider: draft.voice.provider,
        voiceId: draft.voice.voiceId,
        modelId: draft.voice.model,
        providerResourceId: draft.voice.voiceId,
        provisioningStatus: "ready",
        providerMetadata: { source: "studio" },
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
  form.avatarGenerationStatus = "ready";
  form.voiceId = "EXAVITQu4vr4xnSDxMaL";
  form.voiceName = "Sarah";

  const draft = assembleCreateEmployeeDraft(form);
  const persistConfig = buildStudioPersistConfig(draft);

  if (persistConfig.avatar.config.avatarId !== "studio-avatar-001") {
    throw new Error("Avatar persist mapping failed");
  }

  if (persistConfig.avatar.config.previewUrl !== "https://cdn.nullxes.local/kaira.png") {
    throw new Error("Avatar preview URL persist mapping failed");
  }

  if (persistConfig.session.config.voiceId !== "EXAVITQu4vr4xnSDxMaL") {
    throw new Error("Voice persist mapping failed");
  }

  if (persistConfig.session.config.modelId !== "eleven_v3") {
    throw new Error("Voice model persist mapping failed");
  }

  if (persistConfig.avatar.config.provisioningStatus !== "ready") {
    throw new Error("Avatar studio provisioning status must be ready");
  }

  console.log("Employee studio draft:", JSON.stringify(draft, null, 2));
  console.log("Employee studio persist mapping: OK");
  console.log("Employee studio verification: OK");
}

verifyEmployeeStudio();

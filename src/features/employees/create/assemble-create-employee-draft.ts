import type {
  CreateEmployeeDraftPayload,
  CreateEmployeeFormState,
  KnowledgeDraftItem,
} from "./types";

export function buildKnowledgeItemsFromForm(
  form: CreateEmployeeFormState,
): KnowledgeDraftItem[] {
  const items: KnowledgeDraftItem[] = [];

  for (const file of form.knowledgeFiles) {
    items.push({
      type: "file",
      name: file.name,
      size: file.size,
      content: file.content,
    });
  }

  const url = form.knowledgeUrl.trim();
  if (url) {
    items.push({ type: "url", url });
  }

  const text = form.knowledgeText.trim();
  if (text) {
    items.push({ type: "text", content: text });
  }

  return items;
}

export function canAssembleCreateEmployeeDraft(
  form: CreateEmployeeFormState,
): boolean {
  return Boolean(
    form.name.trim() &&
      form.role.trim() &&
      form.avatarId &&
      form.avatarPreviewUrl &&
      form.personaId &&
      form.studioVoiceId &&
      form.voiceId &&
      form.voiceProvider &&
      form.anamPersonaVoiceId &&
      form.voiceBinding,
  );
}

export function assembleCreateEmployeeDraft(
  form: CreateEmployeeFormState,
): CreateEmployeeDraftPayload {
  const name = form.name.trim();
  const role = form.role.trim();

  if (!name) {
    throw new Error("Employee name is required");
  }

  if (!role) {
    throw new Error("Employee role is required");
  }

  if (!form.avatarId || !form.avatarPreviewUrl || !form.personaId) {
    throw new Error("Avatar studio finalization is incomplete");
  }

  if (!form.studioVoiceId || !form.voiceId || !form.voiceProvider) {
    throw new Error("Voice selection is required");
  }

  if (!form.anamPersonaVoiceId || !form.voiceBinding) {
    throw new Error("Voice binding metadata is missing");
  }

  return {
    status: "draft",
    identity: { name, role },
    avatar: {
      avatarId: form.avatarId,
      previewUrl: form.avatarPreviewUrl,
      personaId: form.personaId,
      provider: "anam",
      photoFileName: form.photoFileName,
      photoFileSize: form.photoFileSize,
      generateAvatarEnabled: true,
      anamPersonaVoiceId: form.anamPersonaVoiceId,
      voiceBinding: form.voiceBinding,
    },
    voice: {
      studioVoiceId: form.studioVoiceId,
      voiceId: form.voiceId,
      provider: form.voiceProvider,
      model: form.voiceModel,
    },
    brain: {
      mode: form.brainMode,
      provider:
        form.brainMode === "org_default"
          ? form.orgDefaultBrainProvider
          : form.brainProvider,
      model:
        form.brainMode === "org_default"
          ? form.orgDefaultBrainModel
          : form.brainModel,
    },
    knowledge: buildKnowledgeItemsFromForm(form),
  };
}

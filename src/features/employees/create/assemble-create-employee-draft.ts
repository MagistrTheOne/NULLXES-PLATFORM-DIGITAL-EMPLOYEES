import type {
  CreateEmployeeDraftPayload,
  CreateEmployeeFormState,
  KnowledgeDraftItem,
} from "./types";

function buildKnowledgeItems(form: CreateEmployeeFormState): KnowledgeDraftItem[] {
  const items: KnowledgeDraftItem[] = [];

  for (const file of form.knowledgeFiles) {
    items.push({
      type: "file",
      name: file.name,
      size: file.size,
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

  if (!form.avatarId || !form.avatarPreviewUrl) {
    throw new Error("Avatar must be generated before continuing");
  }

  if (!form.voiceId) {
    throw new Error("Voice selection is required");
  }

  return {
    status: "draft",
    identity: { name, role },
    avatar: {
      avatarId: form.avatarId,
      previewUrl: form.avatarPreviewUrl,
      provider: "anam",
      photoFileName: form.photoFileName,
      photoFileSize: form.photoFileSize,
      generateAvatarEnabled: true,
    },
    voice: {
      voiceId: form.voiceId,
      provider: "elevenlabs",
      model: form.voiceModel,
    },
    brain: {
      provider: form.brainProvider,
    },
    knowledge: buildKnowledgeItems(form),
  };
}

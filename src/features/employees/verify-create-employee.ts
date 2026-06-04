import { assembleCreateEmployeeDraft } from "./create/assemble-create-employee-draft";
import { createInitialFormState } from "./create/constants";

function verifyCreateEmployeeExperience(): void {
  const form = createInitialFormState();
  form.name = "  Megan  ";
  form.role = "Legal Operations Employee";
  form.photoFileName = "megan.png";
  form.photoFileSize = 2048;
  form.avatarId = "anam-avatar-studio-001";
  form.avatarPreviewUrl = "https://cdn.nullxes.local/avatars/megan.png";
  form.avatarGenerationStatus = "ready";
  form.voiceId = "JBFqnCBsd6RMkjVDRZzb";
  form.voiceName = "George";
  form.brainProvider = "anthropic";
  form.knowledgeUrl = "https://docs.nullxes.local/playbook";
  form.knowledgeText = "Compliance reference notes";
  form.knowledgeFiles = [{ name: "policy.pdf", size: 4096 }];

  const draft = assembleCreateEmployeeDraft(form);

  if (draft.status !== "draft") {
    throw new Error("Draft payload must use draft status");
  }

  if (draft.identity.name !== "Megan" || draft.identity.role !== "Legal Operations Employee") {
    throw new Error("Identity fields were not normalized");
  }

  if (draft.brain.provider !== "anthropic") {
    throw new Error("Brain provider was not preserved");
  }

  if (draft.voice.provider !== "elevenlabs" || draft.voice.model !== "eleven_v3") {
    throw new Error("Voice studio fields were not preserved");
  }

  if (draft.voice.voiceId !== "JBFqnCBsd6RMkjVDRZzb") {
    throw new Error("Voice ID was not preserved");
  }

  if (draft.avatar.provider !== "anam" || draft.avatar.avatarId !== "anam-avatar-studio-001") {
    throw new Error("Avatar studio fields were not preserved");
  }

  if (draft.avatar.generateAvatarEnabled !== true) {
    throw new Error("Generate avatar must be enabled when avatarId is set");
  }

  if (draft.knowledge.length !== 3) {
    throw new Error("Knowledge items were not assembled");
  }

  console.log("Create employee draft payload:", JSON.stringify(draft, null, 2));
  console.log("Create employee experience verification: OK");
}

verifyCreateEmployeeExperience();

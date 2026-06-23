import {
  assembleCreateEmployeeDraft,
  canAssembleCreateEmployeeDraft,
} from "./create/assemble-create-employee-draft";
import { createInitialFormState } from "./create/constants";

function verifyCreateEmployeeExperience(): void {
  const form = createInitialFormState();
  form.name = "  Megan  ";
  form.role = "Legal Operations Employee";
  form.photoFileName = "megan.png";
  form.photoFileSize = 2048;
  form.avatarId = "anam-avatar-studio-001";
  form.avatarPreviewUrl = "https://cdn.nullxes.local/avatars/megan.png";
  form.personaId = "persona-studio-001";
  form.avatarGenerationStatus = "ready";
  form.studioVoiceId = "elevenlabs-sarah";
  form.voiceId = "EXAVITQu4vr4xnSDxMaL";
  form.voiceName = "Sarah";
  form.voiceProvider = "elevenlabs";
  form.voiceModel = "eleven_v3";
  form.voiceBinding = "elevenlabs_shell";
  form.anamPersonaVoiceId = "de23e340-1416-4dd8-977d-065a7ca11697";
  form.brainProvider = "anthropic";
  form.knowledgeUrl = "https://docs.nullxes.local/playbook";
  form.knowledgeText = "Compliance reference notes";
  form.knowledgeFiles = [
    { name: "policy.txt", size: 4096, content: "Compliance reference notes from policy." },
  ];

  if (!canAssembleCreateEmployeeDraft(form)) {
    throw new Error("Draft readiness check failed");
  }

  const draft = assembleCreateEmployeeDraft(form);

  if (draft.voice.provider !== "elevenlabs" || draft.voice.model !== "eleven_v3") {
    throw new Error("ElevenLabs voice fields were not preserved");
  }

  if (draft.avatar.voiceBinding !== "elevenlabs_shell") {
    throw new Error("ElevenLabs shell binding was not preserved");
  }

  if (!draft.avatar.personaId) {
    throw new Error("Persona ID was not preserved");
  }

  console.log("Create employee draft payload:", JSON.stringify(draft, null, 2));
  console.log("Create employee experience verification: OK");
}

verifyCreateEmployeeExperience();

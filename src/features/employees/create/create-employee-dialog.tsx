"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEmployeeRecord } from "@/features/employees/actions/create-employee-record";
import { provisionEmployeeAvatarStudio } from "@/features/employees/actions/provision-employee-avatar-studio";
import type { CreateEmployeeWizardInput } from "@/features/employees/create/wizard-intake";
import { previewEmployeeVoice } from "@/features/employees/actions/preview-employee-voice";
import {
  AvatarPreviewCard,
  AvatarUpload,
  VoiceStudioPicker,
} from "@/features/employees/studio";
import { CUSTOM_ELEVENLABS_STUDIO_VOICE_ID } from "@/features/employees/studio/voice/voice-catalog";
import {
  assembleCreateEmployeeDraft,
  buildKnowledgeItemsFromForm,
  canAssembleCreateEmployeeDraft,
} from "./assemble-create-employee-draft";
import { BrainProviderPicker } from "./components/brain-provider-picker";
import {
  CREATE_EMPLOYEE_STEPS,
  DEFAULT_BRAIN_PROVIDER,
  MAX_AVATAR_UPLOAD_BYTES,
  STEP_LABELS,
  createInitialFormState,
} from "./constants";
import type {
  CreateEmployeeDraftPayload,
  CreateEmployeeFormState,
  CreateEmployeeStep,
} from "./types";

function stepIndex(step: CreateEmployeeStep): number {
  return CREATE_EMPLOYEE_STEPS.indexOf(step);
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-end text-sm text-white">{value}</span>
    </div>
  );
}

export function CreateEmployeeDialog({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (result: {
    employeeId: string;
    avatarProvisionStarted: boolean;
  }) => Promise<void>;
}) {
  const [step, setStep] = useState<CreateEmployeeStep>("identity");
  const [form, setForm] = useState<CreateEmployeeFormState>(createInitialFormState);
  const [error, setError] = useState<string | null>(null);
  const [voicePreviewError, setVoicePreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localUploadPreviewUrl, setLocalUploadPreviewUrl] = useState<string | null>(
    null,
  );
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const localUploadPreviewUrlRef = useRef<string | null>(null);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const stepRef = useRef<CreateEmployeeStep>(step);
  stepRef.current = step;

  useEffect(() => {
    return () => {
      if (localUploadPreviewUrlRef.current) {
        URL.revokeObjectURL(localUploadPreviewUrlRef.current);
      }
      if (voicePreviewAudioRef.current) {
        voicePreviewAudioRef.current.pause();
        voicePreviewAudioRef.current = null;
      }
    };
  }, []);

  const currentStepIndex = stepIndex(step);
  const isFirstStep = currentStepIndex === 0;
  const isSummary = step === "summary";

  const draftPreview = useMemo(() => {
    if (!canAssembleCreateEmployeeDraft(form)) {
      return null;
    }
    try {
      return assembleCreateEmployeeDraft(form);
    } catch {
      return null;
    }
  }, [form]);

  const summaryPreviewUrl =
    form.avatarPreviewUrl ?? localUploadPreviewUrl ?? null;

  function updateForm(patch: Partial<CreateEmployeeFormState>): void {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function clearLocalUploadPreview(): void {
    if (localUploadPreviewUrlRef.current) {
      URL.revokeObjectURL(localUploadPreviewUrlRef.current);
      localUploadPreviewUrlRef.current = null;
    }
    setLocalUploadPreviewUrl(null);
  }

  function resetFlow(): void {
    setStep("identity");
    setForm(createInitialFormState());
    setError(null);
    setPreviewingVoiceId(null);
    setVoicePreviewError(null);
    clearLocalUploadPreview();
  }

  function stopVoicePreview(): void {
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
      voicePreviewAudioRef.current = null;
    }
    setPreviewingVoiceId(null);
  }

  function clearStepScopedErrors(nextStep: CreateEmployeeStep): void {
    setError(null);
    if (nextStep !== "voice") {
      stopVoicePreview();
      setVoicePreviewError(null);
    }
  }

  function handleOpenChange(nextOpen: boolean): void {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetFlow();
    }
  }

  function validateCurrentStep(): boolean {
    if (step === "identity") {
      if (!form.name.trim()) {
        setError("Employee name is required.");
        return false;
      }
      if (!form.role.trim()) {
        setError("Role is required.");
        return false;
      }
    }

    if (step === "avatar") {
      if (!form.photoFile) {
        setError("Upload a photo before continuing.");
        return false;
      }
    }

    if (step === "voice") {
      if (!form.studioVoiceId) {
        setError("Select a voice before continuing.");
        return false;
      }
      if (
        form.studioVoiceId === CUSTOM_ELEVENLABS_STUDIO_VOICE_ID &&
        !form.customElevenLabsVoiceId.trim()
      ) {
        setError("Enter a custom ElevenLabs voice ID or pick a catalog voice.");
        return false;
      }
    }

    return true;
  }

  function goNext(): void {
    if (!validateCurrentStep()) {
      return;
    }

    if (step === "brain") {
      updateForm({
        brainProvider: DEFAULT_BRAIN_PROVIDER,
        brainCustomModeEnabled: false,
      });
    }

    const next = CREATE_EMPLOYEE_STEPS[currentStepIndex + 1];
    if (next) {
      clearStepScopedErrors(next);
      setStep(next);
    }
  }

  function goBack(): void {
    const previous = CREATE_EMPLOYEE_STEPS[currentStepIndex - 1];
    if (previous) {
      clearStepScopedErrors(previous);
      setStep(previous);
    }
  }

  async function handleCreate(): Promise<void> {
    if (!form.photoFile || !form.studioVoiceId) {
      setError("Photo and voice are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    updateForm({
      avatarGenerationStatus: "generating",
      avatarGenerationError: null,
    });

    try {
      if (!form.voiceProvider) {
        setError("Select a voice before creating the employee.");
        return;
      }

      const wizardInput: CreateEmployeeWizardInput = {
        name: form.name.trim(),
        role: form.role.trim(),
        brainProvider: DEFAULT_BRAIN_PROVIDER,
        studioVoiceId: form.studioVoiceId,
        customElevenLabsVoiceId:
          form.studioVoiceId === CUSTOM_ELEVENLABS_STUDIO_VOICE_ID
            ? form.customElevenLabsVoiceId.trim()
            : undefined,
        voiceProvider: form.voiceProvider,
        photoFileName: form.photoFileName,
        photoFileSize: form.photoFileSize,
        knowledge: buildKnowledgeItemsFromForm(form),
      };

      const created = await createEmployeeRecord(wizardInput);

      if (!created.ok) {
        updateForm({
          avatarGenerationStatus: "failed",
          avatarGenerationError: created.message,
        });
        setError(created.message);
        return;
      }

      const avatarPayload = new FormData();
      avatarPayload.append("file", form.photoFile);
      avatarPayload.append("name", wizardInput.name);
      avatarPayload.append("role", wizardInput.role);
      avatarPayload.append("studioVoiceId", form.studioVoiceId);
      if (wizardInput.customElevenLabsVoiceId) {
        avatarPayload.append("customElevenLabsVoiceId", wizardInput.customElevenLabsVoiceId);
      }
      if (wizardInput.photoFileName) {
        avatarPayload.append("photoFileName", wizardInput.photoFileName);
      }
      if (wizardInput.photoFileSize != null) {
        avatarPayload.append("photoFileSize", String(wizardInput.photoFileSize));
      }

      updateForm({ avatarGenerationStatus: "generating", avatarGenerationError: null });

      if (onComplete) {
        await onComplete({
          employeeId: created.employeeId,
          avatarProvisionStarted: true,
        });
      }

      handleOpenChange(false);

      void provisionEmployeeAvatarStudio(created.employeeId, avatarPayload).catch(
        (provisionError: unknown) => {
          console.error("Background avatar provisioning failed:", provisionError);
        },
      );
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create digital employee";
      updateForm({
        avatarGenerationStatus: "failed",
        avatarGenerationError: message,
      });
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePhotoSelected(file: File): void {
    if (!file.type.startsWith("image/")) {
      setError("Upload a PNG, JPG, or WebP image.");
      return;
    }

    if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
      setError("Image must be 4.5MB or smaller.");
      return;
    }

    clearLocalUploadPreview();
    const previewUrl = URL.createObjectURL(file);
    localUploadPreviewUrlRef.current = previewUrl;
    setLocalUploadPreviewUrl(previewUrl);

    updateForm({
      photoFile: file,
      photoFileName: file.name,
      photoFileSize: file.size,
      avatarId: null,
      avatarPreviewUrl: null,
      personaId: null,
      avatarGenerationStatus: "idle",
      avatarGenerationError: null,
    });
  }

  async function handlePreviewVoice(elevenLabsVoiceId: string): Promise<void> {
    const requestStep = stepRef.current;
    setPreviewingVoiceId(elevenLabsVoiceId);
    setVoicePreviewError(null);

    const result = await previewEmployeeVoice(elevenLabsVoiceId);

    if (stepRef.current !== requestStep || requestStep !== "voice") {
      setPreviewingVoiceId(null);
      return;
    }

    if (result.status === "failed") {
      setPreviewingVoiceId(null);
      setVoicePreviewError(result.message);
      return;
    }

    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
    }

    const audio = new Audio(`data:${result.contentType};base64,${result.audioBase64}`);
    voicePreviewAudioRef.current = audio;
    audio.onended = () => setPreviewingVoiceId(null);
    audio.onerror = () => {
      setPreviewingVoiceId(null);
      setVoicePreviewError("Unable to play voice preview.");
    };

    try {
      await audio.play();
    } catch {
      setPreviewingVoiceId(null);
      setVoicePreviewError("Unable to play voice preview.");
    }
  }

  function handleKnowledgeFilesChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    const files = Array.from(event.target.files ?? []);
    updateForm({
      knowledgeFiles: files.map((file) => ({
        name: file.name,
        size: file.size,
      })),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden border-white/10 bg-[#111111] p-0 text-white">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-lg font-medium text-white">
            Create Digital Employee
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Step {currentStepIndex + 1} of {CREATE_EMPLOYEE_STEPS.length} ·{" "}
            {STEP_LABELS[step]}
          </DialogDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            {CREATE_EMPLOYEE_STEPS.map((item, index) => (
              <span
                key={item}
                className={
                  index <= currentStepIndex
                    ? "text-xs text-white"
                    : "text-xs text-white/35"
                }
              >
                {STEP_LABELS[item]}
              </span>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === "identity" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee-name" className="text-white/80">
                  Employee Name
                </Label>
                <Input
                  id="employee-name"
                  value={form.name}
                  onChange={(event) => updateForm({ name: event.target.value })}
                  className="border-white/10 bg-black/40 text-white"
                  placeholder="Somnia"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee-role" className="text-white/80">
                  Role
                </Label>
                <Input
                  id="employee-role"
                  value={form.role}
                  onChange={(event) => updateForm({ role: event.target.value })}
                  className="border-white/10 bg-black/40 text-white"
                  placeholder="Enterprise Sales Employee"
                />
              </div>
            </div>
          ) : null}

          {step === "avatar" ? (
            <div className="flex flex-col gap-4">
              <AvatarUpload
                photoFileName={form.photoFileName}
                localPreviewUrl={localUploadPreviewUrl}
                onFileSelected={handlePhotoSelected}
              />
              <p className="text-xs text-white/50">
                Avatar is generated on the final step after you choose a voice,
                so your ElevenLabs selection is not replaced by Anam defaults.
              </p>
            </div>
          ) : null}

          {step === "voice" ? (
            <div className="flex flex-col gap-4">
              <VoiceStudioPicker
                selectedVoiceId={form.studioVoiceId}
                customElevenLabsVoiceId={form.customElevenLabsVoiceId}
                previewingVoiceId={previewingVoiceId}
                onSelectVoice={({ studioVoiceId, voiceName, provider }) =>
                  updateForm({
                    studioVoiceId,
                    voiceName,
                    voiceProvider: provider === "Anam" ? "anam" : "elevenlabs",
                    customElevenLabsVoiceId: "",
                  })
                }
                onApplyCustomVoice={(elevenLabsVoiceId) =>
                  updateForm({
                    studioVoiceId: CUSTOM_ELEVENLABS_STUDIO_VOICE_ID,
                    customElevenLabsVoiceId: elevenLabsVoiceId.trim(),
                    voiceName: `Custom (${elevenLabsVoiceId.slice(0, 8)}…)`,
                    voiceProvider: "elevenlabs",
                  })
                }
                onPreviewVoice={handlePreviewVoice}
              />
              {voicePreviewError ? (
                <p className="text-sm text-white/70" role="alert">
                  {voicePreviewError}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === "brain" ? (
            <BrainProviderPicker
              brainProvider={form.brainProvider}
              customModeEnabled={form.brainCustomModeEnabled}
              onBrainProviderChange={() => undefined}
              onCustomModeChange={(enabled) =>
                updateForm({
                  brainCustomModeEnabled: enabled,
                  brainProvider: DEFAULT_BRAIN_PROVIDER,
                })
              }
            />
          ) : null}

          {step === "knowledge" ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-white/80">Upload Files</Label>
                <Input
                  type="file"
                  multiple
                  onChange={handleKnowledgeFilesChange}
                  className="border-white/10 bg-black/40 text-white file:text-white/70"
                />
                {form.knowledgeFiles.length > 0 ? (
                  <p className="text-xs text-white/50">
                    {form.knowledgeFiles.length} file
                    {form.knowledgeFiles.length === 1 ? "" : "s"} selected
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="knowledge-url" className="text-white/80">
                  Add URL
                </Label>
                <Input
                  id="knowledge-url"
                  type="url"
                  value={form.knowledgeUrl}
                  onChange={(event) =>
                    updateForm({ knowledgeUrl: event.target.value })
                  }
                  placeholder="https://"
                  className="border-white/10 bg-black/40 text-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="knowledge-text" className="text-white/80">
                  Paste Text
                </Label>
                <Textarea
                  id="knowledge-text"
                  value={form.knowledgeText}
                  onChange={(event) =>
                    updateForm({ knowledgeText: event.target.value })
                  }
                  placeholder="Paste reference text for this employee."
                  className="min-h-28 border-white/10 bg-black/40 text-white"
                />
              </div>
            </div>
          ) : null}

          {step === "summary" ? (
            <div className="flex flex-col gap-4">
              {summaryPreviewUrl ? (
                <AvatarPreviewCard
                  previewUrl={summaryPreviewUrl}
                  alt={form.name || "Employee photo"}
                  className="max-w-sm"
                />
              ) : null}
              <div className="rounded-xl border border-white/10 bg-black/30 px-4">
                <SummaryRow label="Name" value={form.name.trim() || "—"} />
                <SummaryRow label="Role" value={form.role.trim() || "—"} />
                <SummaryRow
                  label="Voice"
                  value={
                    form.voiceName
                      ? `${form.voiceName} (${form.voiceProvider ?? "—"})`
                      : "—"
                  }
                />
                <SummaryRow label="Brain" value="OpenAI" />
                <SummaryRow
                  label="Knowledge"
                  value={`${form.knowledgeFiles.length + (form.knowledgeUrl.trim() ? 1 : 0) + (form.knowledgeText.trim() ? 1 : 0)} item(s)`}
                />
                <SummaryRow
                  label="Avatar"
                  value="Provisioned in background after create"
                />
              </div>
              {form.avatarGenerationError ? (
                <p className="text-sm text-white/70" role="alert">
                  {form.avatarGenerationError}
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-white/80" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={isFirstStep || isSubmitting}
            className="text-white hover:bg-white/5 hover:text-white"
          >
            Back
          </Button>
          {isSummary ? (
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting || !form.photoFile || !form.studioVoiceId}
              className="bg-white text-black hover:bg-white/90"
            >
              {isSubmitting ? "Saving employee…" : "Create Employee"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              className="bg-white text-black hover:bg-white/90"
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

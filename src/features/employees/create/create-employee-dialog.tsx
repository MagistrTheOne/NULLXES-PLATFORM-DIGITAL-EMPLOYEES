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
import { finalizeEmployeeStudio } from "@/features/employees/actions/finalize-employee-studio";
import { previewEmployeeVoice } from "@/features/employees/actions/preview-employee-voice";
import { AvatarPreviewCard, AvatarUpload, VoiceStudioGrid } from "@/features/employees/studio";
import {
  assembleCreateEmployeeDraft,
  canAssembleCreateEmployeeDraft,
} from "./assemble-create-employee-draft";
import { ProviderOption } from "./components/provider-option";
import {
  BRAIN_PROVIDER_OPTIONS,
  CREATE_EMPLOYEE_STEPS,
  MAX_AVATAR_UPLOAD_BYTES,
  STEP_LABELS,
  createInitialFormState,
} from "./constants";
import type { BrainProvider } from "@/entities/digital-employee";
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
  onComplete?: (draft: CreateEmployeeDraftPayload) => Promise<void>;
}) {
  const [step, setStep] = useState<CreateEmployeeStep>("identity");
  const [form, setForm] = useState<CreateEmployeeFormState>(createInitialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localUploadPreviewUrl, setLocalUploadPreviewUrl] = useState<string | null>(
    null,
  );
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const localUploadPreviewUrlRef = useRef<string | null>(null);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);

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
    clearLocalUploadPreview();
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
    }

    return true;
  }

  function goNext(): void {
    if (!validateCurrentStep()) {
      return;
    }
    const next = CREATE_EMPLOYEE_STEPS[currentStepIndex + 1];
    if (next) {
      setStep(next);
      setError(null);
    }
  }

  function goBack(): void {
    const previous = CREATE_EMPLOYEE_STEPS[currentStepIndex - 1];
    if (previous) {
      setStep(previous);
      setError(null);
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
      const payload = new FormData();
      payload.append("file", form.photoFile);
      payload.append("name", form.name.trim());
      payload.append("role", form.role.trim());
      payload.append("studioVoiceId", form.studioVoiceId);

      const studio = await finalizeEmployeeStudio(payload);

      if (studio.status === "failed") {
        updateForm({
          avatarGenerationStatus: "failed",
          avatarGenerationError: studio.message,
        });
        setError(studio.message);
        return;
      }

      const nextForm: CreateEmployeeFormState = {
        ...form,
        avatarId: studio.avatarId,
        avatarPreviewUrl: studio.previewUrl,
        personaId: studio.personaId,
        avatarProvider: studio.provider,
        avatarGenerationStatus: "ready",
        avatarGenerationError: null,
        studioVoiceId: studio.voice.studioVoiceId,
        voiceId: studio.voice.voiceId,
        voiceProvider: studio.voice.provider,
        voiceModel: studio.voice.model,
        voiceBinding: studio.voice.voiceBinding,
        anamPersonaVoiceId: studio.voice.anamPersonaVoiceId,
      };

      setForm(nextForm);

      const draft = assembleCreateEmployeeDraft(nextForm);
      if (onComplete) {
        await onComplete(draft);
      }
      handleOpenChange(false);
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
    setPreviewingVoiceId(elevenLabsVoiceId);
    setError(null);

    const result = await previewEmployeeVoice(elevenLabsVoiceId);

    if (result.status === "failed") {
      setPreviewingVoiceId(null);
      setError(result.message);
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
      setError("Unable to play voice preview.");
    };

    try {
      await audio.play();
    } catch {
      setPreviewingVoiceId(null);
      setError("Unable to play voice preview.");
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
            <VoiceStudioGrid
              selectedVoiceId={form.studioVoiceId}
              previewingVoiceId={previewingVoiceId}
              onSelectVoice={({ studioVoiceId, voiceName, provider }) =>
                updateForm({
                  studioVoiceId,
                  voiceName,
                  voiceProvider:
                    provider === "Anam" ? "anam" : "elevenlabs",
                })
              }
              onPreviewVoice={handlePreviewVoice}
            />
          ) : null}

          {step === "brain" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {BRAIN_PROVIDER_OPTIONS.map((option) => (
                <ProviderOption
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selected={form.brainProvider === option.value}
                  onSelect={(value: BrainProvider) =>
                    updateForm({ brainProvider: value })
                  }
                />
              ))}
            </div>
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
                <SummaryRow label="Brain" value={form.brainProvider} />
                <SummaryRow
                  label="Knowledge"
                  value={`${form.knowledgeFiles.length + (form.knowledgeUrl.trim() ? 1 : 0) + (form.knowledgeText.trim() ? 1 : 0)} item(s)`}
                />
                <SummaryRow
                  label="Avatar"
                  value="Generated when you create the employee"
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
              {isSubmitting ? "Generating avatar…" : "Create Employee"}
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

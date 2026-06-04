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
import { generateEmployeeAvatar } from "@/features/employees/actions/generate-employee-avatar";
import { previewEmployeeVoice } from "@/features/employees/actions/preview-employee-voice";
import {
  AvatarGenerationState,
  AvatarPreviewCard,
  AvatarUpload,
  VoiceStudioGrid,
} from "@/features/employees/studio";
import { assembleCreateEmployeeDraft } from "./assemble-create-employee-draft";
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
    try {
      return assembleCreateEmployeeDraft(form);
    } catch {
      return null;
    }
  }, [form]);

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
      if (!form.avatarId || !form.avatarPreviewUrl) {
        setError("Generate an avatar before continuing.");
        return false;
      }
    }

    if (step === "voice") {
      if (!form.voiceId) {
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
    setIsSubmitting(true);
    setError(null);

    try {
      const draft = assembleCreateEmployeeDraft(form);
      if (onComplete) {
        await onComplete(draft);
      }
      handleOpenChange(false);
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create digital employee";
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
      setError("Image must be 5MB or smaller.");
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
      avatarGenerationStatus: "idle",
      avatarGenerationError: null,
    });
  }

  async function handleGenerateAvatar(): Promise<void> {
    if (!form.photoFile) {
      setError("Upload a photo before generating an avatar.");
      return;
    }

    const displayName = form.name.trim() || "NULLXES Digital Employee";
    updateForm({
      avatarGenerationStatus: "generating",
      avatarGenerationError: null,
    });

    const payload = new FormData();
    payload.append("file", form.photoFile);
    payload.append("displayName", displayName);

    const result = await generateEmployeeAvatar(payload);

    if (result.status === "failed") {
      updateForm({
        avatarGenerationStatus: "failed",
        avatarGenerationError: result.message,
      });
      setError(result.message);
      return;
    }

    updateForm({
      avatarId: result.avatarId,
      avatarPreviewUrl: result.previewUrl,
      avatarProvider: result.provider,
      avatarGenerationStatus: "ready",
      avatarGenerationError: null,
    });
    setError(null);
  }

  async function handlePreviewVoice(voiceId: string): Promise<void> {
    setPreviewingVoiceId(voiceId);
    setError(null);

    const result = await previewEmployeeVoice(voiceId);

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

  const uploadPreviewUrl = localUploadPreviewUrl;
  const showGeneratedPreview =
    form.avatarGenerationStatus === "ready" && form.avatarPreviewUrl;

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
              {showGeneratedPreview ? (
                <AvatarPreviewCard
                  previewUrl={form.avatarPreviewUrl!}
                  alt={form.name || "Generated avatar"}
                />
              ) : (
                <AvatarUpload
                  photoFileName={form.photoFileName}
                  localPreviewUrl={uploadPreviewUrl}
                  disabled={
                    form.avatarGenerationStatus === "generating" ||
                    form.avatarGenerationStatus === "uploading"
                  }
                  onFileSelected={handlePhotoSelected}
                />
              )}
              <AvatarGenerationState
                status={form.avatarGenerationStatus}
                errorMessage={form.avatarGenerationError}
                canGenerate={Boolean(form.photoFile)}
                onGenerate={handleGenerateAvatar}
              />
            </div>
          ) : null}

          {step === "voice" ? (
            <VoiceStudioGrid
              selectedVoiceId={form.voiceId}
              previewingVoiceId={previewingVoiceId}
              onSelectVoice={(voiceId, voiceName) =>
                updateForm({ voiceId, voiceName })
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

          {step === "summary" && draftPreview ? (
            <div className="flex flex-col gap-4">
              <AvatarPreviewCard
                previewUrl={draftPreview.avatar.previewUrl}
                alt={draftPreview.identity.name}
                className="max-w-sm"
              />
              <div className="rounded-xl border border-white/10 bg-black/30 px-4">
                <SummaryRow label="Name" value={draftPreview.identity.name} />
                <SummaryRow label="Role" value={draftPreview.identity.role} />
                <SummaryRow
                  label="Voice"
                  value={form.voiceName ?? draftPreview.voice.voiceId}
                />
                <SummaryRow
                  label="Brain"
                  value={draftPreview.brain.provider}
                />
                <SummaryRow
                  label="Knowledge"
                  value={`${draftPreview.knowledge.length} item${draftPreview.knowledge.length === 1 ? "" : "s"}`}
                />
                <SummaryRow label="Status" value={draftPreview.status} />
              </div>
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
            disabled={isFirstStep}
            className="text-white hover:bg-white/5 hover:text-white"
          >
            Back
          </Button>
          {isSummary ? (
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting || !draftPreview}
              className="bg-white text-black hover:bg-white/90"
            >
              {isSubmitting ? "Creating..." : "Create Employee"}
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

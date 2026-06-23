"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
import { createAudioPreviewObjectUrl } from "@/features/employees/lib/play-base64-audio-preview";
import {
  AvatarPreviewCard,
  AvatarStudioStep,
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
    name: string;
    role: string;
    portraitPreviewUrl: string;
  }) => Promise<void>;
}) {
  const t = useTranslations("employees.create");
  const tCommon = useTranslations("common.actions");
  const [step, setStep] = useState<CreateEmployeeStep>("identity");
  const [form, setForm] = useState<CreateEmployeeFormState>(createInitialFormState);
  const [error, setError] = useState<string | null>(null);
  const [voicePreviewError, setVoicePreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localUploadPreviewUrl, setLocalUploadPreviewUrl] = useState<string | null>(
    null,
  );
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const localUploadPreviewUrlRef = useRef<string | null>(null);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const voicePreviewObjectUrlRef = useRef<string | null>(null);
  const stepRef = useRef<CreateEmployeeStep>(step);
  stepRef.current = step;

  useEffect(() => {
    return () => {
      if (localUploadPreviewUrlRef.current) {
        URL.revokeObjectURL(localUploadPreviewUrlRef.current);
      }
      if (voicePreviewObjectUrlRef.current) {
        URL.revokeObjectURL(voicePreviewObjectUrlRef.current);
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
    setIsGeneratingAvatar(false);
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
        setError(t("errors.nameRequired"));
        return false;
      }
      if (!form.role.trim()) {
        setError(t("errors.roleRequired"));
        return false;
      }
    }

    if (step === "avatar") {
      if (isGeneratingAvatar) {
        setError(t("errors.avatarGenerating"));
        return false;
      }
      if (!form.photoFile) {
        setError(t("errors.photoRequired"));
        return false;
      }
    }

    if (step === "voice") {
      if (!form.studioVoiceId) {
        setError(t("errors.voiceRequired"));
        return false;
      }
      if (
        form.studioVoiceId === CUSTOM_ELEVENLABS_STUDIO_VOICE_ID &&
        !form.customElevenLabsVoiceId.trim()
      ) {
        setError(t("errors.customVoiceRequired"));
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
      setError(t("errors.photoVoiceRequired"));
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
        setError(t("errors.voiceBeforeCreate"));
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
        const portraitPreviewUrl = summaryPreviewUrl;
        if (!portraitPreviewUrl) {
          setError(t("errors.photoVoiceRequired"));
          return;
        }

        await onComplete({
          employeeId: created.employeeId,
          avatarProvisionStarted: true,
          name: wizardInput.name,
          role: wizardInput.role,
          portraitPreviewUrl,
        });
      }

      handleOpenChange(false);

      void provisionEmployeeAvatarStudio(created.employeeId, avatarPayload).catch(
        () => undefined,
      );
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : t("errors.createFailed");
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
      setError(t("errors.invalidImage"));
      return;
    }

    if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
      setError(t("errors.imageTooLarge"));
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
      avatarSource: "upload",
      avatarId: null,
      avatarPreviewUrl: null,
      personaId: null,
      avatarGenerationStatus: "idle",
      avatarGenerationError: null,
    });
  }

  function handleGeneratedPhoto(file: File, previewUrl: string): void {
    if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
      setError(t("errors.imageTooLarge"));
      return;
    }

    clearLocalUploadPreview();
    localUploadPreviewUrlRef.current = previewUrl;
    setLocalUploadPreviewUrl(previewUrl);

    updateForm({
      photoFile: file,
      photoFileName: file.name,
      photoFileSize: file.size,
      avatarSource: "generate",
      avatarId: null,
      avatarPreviewUrl: null,
      personaId: null,
      avatarGenerationStatus: "ready",
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
      voicePreviewAudioRef.current = null;
    }

    if (voicePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(voicePreviewObjectUrlRef.current);
      voicePreviewObjectUrlRef.current = null;
    }

    const objectUrl = createAudioPreviewObjectUrl({
      audioBase64: result.audioBase64,
      contentType: result.contentType,
    });
    voicePreviewObjectUrlRef.current = objectUrl;

    const audio = new Audio(objectUrl);
    voicePreviewAudioRef.current = audio;
    audio.onended = () => setPreviewingVoiceId(null);
    audio.onerror = () => {
      setPreviewingVoiceId(null);
      setVoicePreviewError(t("errors.voicePreviewPlay"));
    };

    try {
      await audio.play();
    } catch {
      setPreviewingVoiceId(null);
      setVoicePreviewError(t("errors.voicePreviewPlay"));
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
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {t("stepProgress", {
              current: currentStepIndex + 1,
              total: CREATE_EMPLOYEE_STEPS.length,
              step: t(`steps.${step}`),
            })}
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
                {t(`steps.${item}`)}
              </span>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === "identity" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee-name" className="text-white/80">
                  {t("identity.name")}
                </Label>
                <Input
                  id="employee-name"
                  value={form.name}
                  onChange={(event) => updateForm({ name: event.target.value })}
                  className="border-white/10 bg-black/40 text-white"
                  placeholder={t("identity.namePlaceholder")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee-role" className="text-white/80">
                  {t("identity.role")}
                </Label>
                <Input
                  id="employee-role"
                  value={form.role}
                  onChange={(event) => updateForm({ role: event.target.value })}
                  className="border-white/10 bg-black/40 text-white"
                  placeholder={t("identity.rolePlaceholder")}
                />
              </div>
            </div>
          ) : null}

          {step === "avatar" ? (
            <div className="flex flex-col gap-4">
              <AvatarStudioStep
                employeeName={form.name}
                employeeRole={form.role}
                photoFileName={form.photoFileName}
                localPreviewUrl={localUploadPreviewUrl}
                avatarPrompt={form.avatarPrompt}
                avatarSource={form.avatarSource}
                isGenerating={isGeneratingAvatar}
                generationError={form.avatarGenerationError}
                onPhotoSelected={handlePhotoSelected}
                onGeneratedPhoto={handleGeneratedPhoto}
                onPromptChange={(prompt) => updateForm({ avatarPrompt: prompt })}
                onSourceChange={(avatarSource) => updateForm({ avatarSource })}
                onGeneratingChange={setIsGeneratingAvatar}
                onGenerationError={(message) =>
                  updateForm({ avatarGenerationError: message })
                }
              />
              <p className="text-xs text-white/50">{t("avatar.hint")}</p>
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
                <Label className="text-white/80">{t("knowledge.uploadFiles")}</Label>
                <Input
                  type="file"
                  multiple
                  onChange={handleKnowledgeFilesChange}
                  className="border-white/10 bg-black/40 text-white file:text-white/70"
                />
                {form.knowledgeFiles.length > 0 ? (
                  <p className="text-xs text-white/50">
                    {t("knowledge.filesSelected", {
                      count: form.knowledgeFiles.length,
                    })}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="knowledge-url" className="text-white/80">
                  {t("knowledge.addUrl")}
                </Label>
                <Input
                  id="knowledge-url"
                  type="url"
                  value={form.knowledgeUrl}
                  onChange={(event) =>
                    updateForm({ knowledgeUrl: event.target.value })
                  }
                  placeholder={t("knowledge.urlPlaceholder")}
                  className="border-white/10 bg-black/40 text-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="knowledge-text" className="text-white/80">
                  {t("knowledge.pasteText")}
                </Label>
                <Textarea
                  id="knowledge-text"
                  value={form.knowledgeText}
                  onChange={(event) =>
                    updateForm({ knowledgeText: event.target.value })
                  }
                  placeholder={t("knowledge.textPlaceholder")}
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
                <SummaryRow
                  label={t("summary.name")}
                  value={form.name.trim() || t("summary.empty")}
                />
                <SummaryRow
                  label={t("summary.role")}
                  value={form.role.trim() || t("summary.empty")}
                />
                <SummaryRow
                  label={t("summary.voice")}
                  value={
                    form.voiceName
                      ? `${form.voiceName} (${form.voiceProvider ?? t("summary.empty")})`
                      : t("summary.empty")
                  }
                />
                <SummaryRow label={t("summary.brain")} value="OpenAI" />
                <SummaryRow
                  label={t("summary.knowledge")}
                  value={t("summary.items", {
                    count:
                      form.knowledgeFiles.length +
                      (form.knowledgeUrl.trim() ? 1 : 0) +
                      (form.knowledgeText.trim() ? 1 : 0),
                  })}
                />
                <SummaryRow
                  label={t("summary.avatar")}
                  value={t("summary.avatarValue")}
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
            {t("actions.back")}
          </Button>
          {isSummary ? (
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting || !form.photoFile || !form.studioVoiceId}
              className="bg-white text-black hover:bg-white/90"
            >
              {isSubmitting ? t("actions.creating") : tCommon("createEmployee")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={isGeneratingAvatar}
              className="bg-white text-black hover:bg-white/90"
            >
              {tCommon("continue")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

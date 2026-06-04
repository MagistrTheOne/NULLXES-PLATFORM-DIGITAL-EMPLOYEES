"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
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
import { assembleCreateEmployeeDraft } from "./assemble-create-employee-draft";
import { ProviderOption } from "./components/provider-option";
import {
  BRAIN_PROVIDER_OPTIONS,
  CREATE_EMPLOYEE_STEPS,
  STEP_LABELS,
  VOICE_PROVIDER_OPTIONS,
  createInitialFormState,
} from "./constants";
import type { BrainProvider } from "@/entities/digital-employee";
import type {
  CreateEmployeeDraftPayload,
  CreateEmployeeFormState,
  CreateEmployeeStep,
  VoiceProvider,
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
  onComplete?: (draft: CreateEmployeeDraftPayload) => void;
}) {
  const [step, setStep] = useState<CreateEmployeeStep>("identity");
  const [form, setForm] = useState<CreateEmployeeFormState>(createInitialFormState);
  const [error, setError] = useState<string | null>(null);

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

  function resetFlow(): void {
    setStep("identity");
    setForm(createInitialFormState());
    setError(null);
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

  function handleCreate(): void {
    try {
      const draft = assembleCreateEmployeeDraft(form);
      onComplete?.(draft);
      handleOpenChange(false);
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to assemble employee draft";
      setError(message);
    }
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      updateForm({ photoFileName: null, photoFileSize: null });
      return;
    }
    updateForm({ photoFileName: file.name, photoFileSize: file.size });
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
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/2 px-6 py-10 hover:border-white/25 hover:bg-white/4">
                <Upload className="size-6 text-white/50" />
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Upload Photo</p>
                  <p className="mt-1 text-xs text-white/50">
                    {form.photoFileName ?? "PNG or JPG, stored locally for this draft"}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                disabled
                className="border-white/10 bg-transparent text-white/40"
              >
                Generate Avatar
              </Button>
            </div>
          ) : null}

          {step === "voice" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {VOICE_PROVIDER_OPTIONS.map((option) => (
                <ProviderOption
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selected={form.voiceProvider === option.value}
                  onSelect={(value: VoiceProvider) =>
                    updateForm({ voiceProvider: value })
                  }
                />
              ))}
            </div>
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
            <div className="rounded-xl border border-white/10 bg-black/30 px-4">
              <SummaryRow label="Name" value={draftPreview.identity.name} />
              <SummaryRow label="Role" value={draftPreview.identity.role} />
              <SummaryRow
                label="Avatar"
                value={draftPreview.avatar.photoFileName ?? "No photo uploaded"}
              />
              <SummaryRow
                label="Voice"
                value={draftPreview.voice.provider}
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
              className="bg-white text-black hover:bg-white/90"
            >
              Create Employee
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

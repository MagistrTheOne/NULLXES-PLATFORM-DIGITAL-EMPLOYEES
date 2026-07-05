import type { CreateEmployeeFormState, CreateEmployeeStep } from "./types";
import { createInitialFormState } from "./constants";

const STORAGE_KEY = "nullxes.create-employee-wizard.v1";

export type PersistedCreateEmployeeWizard = {
  step: CreateEmployeeStep;
  form: Omit<CreateEmployeeFormState, "photoFile">;
  savedAt: string;
};

function isStep(value: unknown): value is CreateEmployeeStep {
  return (
    value === "identity" ||
    value === "avatar" ||
    value === "voice" ||
    value === "character" ||
    value === "brain" ||
    value === "knowledge" ||
    value === "summary"
  );
}

export function readCreateEmployeeWizardDraft(): PersistedCreateEmployeeWizard | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedCreateEmployeeWizard;
    if (!isStep(parsed.step) || !parsed.form || typeof parsed.form !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeCreateEmployeeWizardDraft(input: {
  step: CreateEmployeeStep;
  form: CreateEmployeeFormState;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const { photoFile: _photoFile, ...formWithoutFile } = input.form;

  const payload: PersistedCreateEmployeeWizard = {
    step: input.step,
    form: formWithoutFile,
    savedAt: new Date().toISOString(),
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearCreateEmployeeWizardDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function mergePersistedFormState(
  persisted: PersistedCreateEmployeeWizard,
  defaults: CreateEmployeeFormState,
): { step: CreateEmployeeStep; form: CreateEmployeeFormState } {
  return {
    step: persisted.step,
    form: {
      ...defaults,
      ...persisted.form,
      photoFile: null,
    },
  };
}

export function hasMeaningfulWizardDraft(
  draft: PersistedCreateEmployeeWizard | null,
): boolean {
  if (!draft) {
    return false;
  }

  const { form } = draft;
  return Boolean(
    form.name.trim() ||
      form.role.trim() ||
      form.presetAvatarId ||
      form.studioVoiceId ||
      form.knowledgeFiles.length > 0 ||
      form.knowledgeText.trim() ||
      form.knowledgeUrl.trim(),
  );
}

export function createInitialFormForPlan(allowCustomAvatars: boolean): CreateEmployeeFormState {
  return {
    ...createInitialFormState(),
    avatarSource: allowCustomAvatars ? "upload" : "preset",
  };
}

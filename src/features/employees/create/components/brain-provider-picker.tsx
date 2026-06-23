"use client";

import type { BrainProvider } from "@/entities/digital-employee";
import {
  BrainAssignmentField,
  type BrainAssignmentMode,
  type BrainProviderReadinessMap,
} from "@/features/brain";
import { getDefaultBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";

export function BrainProviderPicker({
  mode,
  orgDefaultProvider,
  orgDefaultModel,
  customProvider,
  customModel,
  providerReadiness,
  onModeChange,
  onCustomProviderChange,
  onCustomModelChange,
}: {
  mode: BrainAssignmentMode;
  orgDefaultProvider: BrainProvider;
  orgDefaultModel: string;
  customProvider: BrainProvider;
  customModel: string;
  providerReadiness: BrainProviderReadinessMap;
  onModeChange: (mode: BrainAssignmentMode) => void;
  onCustomProviderChange: (provider: BrainProvider) => void;
  onCustomModelChange: (model: string) => void;
}) {
  return (
    <BrainAssignmentField
      mode={mode}
      orgDefaultProvider={orgDefaultProvider}
      orgDefaultModel={orgDefaultModel}
      customProvider={customProvider}
      customModel={customModel}
      providerReadiness={providerReadiness}
      onModeChange={onModeChange}
      onCustomProviderChange={(provider) => {
        onCustomProviderChange(provider);
        onCustomModelChange(getDefaultBrainModelForProvider(provider));
      }}
      onCustomModelChange={onCustomModelChange}
    />
  );
}

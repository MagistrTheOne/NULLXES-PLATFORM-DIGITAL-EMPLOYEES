"use server";

import { revalidatePath } from "next/cache";
import type {
  CharacterLanguagePolicy,
  CharacterSpeechStyle,
  CharacterTraits,
} from "@/entities/character-preset/types";
import type { SkillCategory } from "@/entities/skill/types";
import type { SkillProficiency } from "@/entities/skill/types";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import {
  createCharacterPreset,
  deleteCharacterPreset,
  duplicateCharacterPreset,
  updateCharacterPreset,
} from "../services/create-character-preset";
import { createSkill, deleteSkill, updateSkill } from "../services/create-skill";
import { upsertEmployeeCharacter } from "../services/upsert-employee-character";
import {
  assignEmployeeSkills,
  removeEmployeeSkill,
} from "../services/assign-employee-skills";
import {
  setOrganizationToolActive,
  syncEmployeeTool,
} from "../services/sync-employee-tools";

function revalidateBlueprintPaths(employeeId?: string) {
  revalidatePath("/settings");
  if (employeeId) {
    revalidatePath(`/dashboard/employees/${employeeId}`);
  }
}

export async function createCharacterPresetAction(input: {
  name: string;
  description?: string;
  traits: CharacterTraits;
  speechStyle: CharacterSpeechStyle;
  boundaries?: string;
  languagePolicy?: CharacterLanguagePolicy;
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageOrganization",
  );

  const id = await createCharacterPreset({
    organizationId: workspace.organization.id,
    ...input,
  });

  revalidateBlueprintPaths();
  return { ok: true as const, id };
}

export async function updateCharacterPresetAction(input: {
  presetId: string;
  name: string;
  description?: string;
  traits: CharacterTraits;
  speechStyle: CharacterSpeechStyle;
  boundaries?: string;
  languagePolicy?: CharacterLanguagePolicy;
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageOrganization",
  );

  await updateCharacterPreset({
    organizationId: workspace.organization.id,
    ...input,
  });

  revalidateBlueprintPaths();
  return { ok: true as const };
}

export async function deleteCharacterPresetAction(presetId: string) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageOrganization",
  );

  await deleteCharacterPreset({
    organizationId: workspace.organization.id,
    presetId,
  });

  revalidateBlueprintPaths();
  return { ok: true as const };
}

export async function duplicateCharacterPresetAction(input: {
  sourcePresetId: string;
  name?: string;
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageOrganization",
  );

  const id = await duplicateCharacterPreset({
    organizationId: workspace.organization.id,
    ...input,
  });

  revalidateBlueprintPaths();
  return { ok: true as const, id };
}

export async function createSkillAction(input: {
  name: string;
  description?: string;
  instructions: string;
  keywords?: string[];
  category?: SkillCategory;
  requiredToolSlugs?: string[];
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageOrganization",
  );

  const id = await createSkill({
    organizationId: workspace.organization.id,
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    triggers: { keywords: input.keywords ?? [], intents: [] },
    category: input.category,
    requiredToolSlugs: input.requiredToolSlugs,
  });

  revalidateBlueprintPaths();
  return { ok: true as const, id };
}

export async function updateSkillAction(input: {
  skillId: string;
  name: string;
  description?: string;
  instructions: string;
  keywords?: string[];
  category?: SkillCategory;
  requiredToolSlugs?: string[];
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageOrganization",
  );

  await updateSkill({
    organizationId: workspace.organization.id,
    skillId: input.skillId,
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    triggers: { keywords: input.keywords ?? [], intents: [] },
    category: input.category,
    requiredToolSlugs: input.requiredToolSlugs,
  });

  revalidateBlueprintPaths();
  return { ok: true as const };
}

export async function deleteSkillAction(skillId: string) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageOrganization",
  );

  await deleteSkill({
    organizationId: workspace.organization.id,
    skillId,
  });

  revalidateBlueprintPaths();
  return { ok: true as const };
}

export async function upsertEmployeeCharacterAction(input: {
  employeeId: string;
  presetId?: string | null;
  traitOverrides?: Partial<CharacterTraits>;
  customPromptBlock?: string | null;
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageEmployees",
  );

  await upsertEmployeeCharacter({
    organizationId: workspace.organization.id,
    ...input,
  });

  revalidateBlueprintPaths(input.employeeId);
  return { ok: true as const };
}

export async function assignEmployeeSkillsAction(input: {
  employeeId: string;
  skillIds: string[];
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageEmployees",
  );

  await assignEmployeeSkills({
    organizationId: workspace.organization.id,
    employeeId: input.employeeId,
    assignments: input.skillIds.map((skillId, index) => ({
      skillId,
      priority: index,
      isActive: true,
    })),
  });

  revalidateBlueprintPaths(input.employeeId);
  return { ok: true as const };
}

export async function removeEmployeeSkillAction(input: {
  employeeId: string;
  skillId: string;
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageEmployees",
  );

  await removeEmployeeSkill({
    organizationId: workspace.organization.id,
    employeeId: input.employeeId,
    skillId: input.skillId,
  });

  revalidateBlueprintPaths(input.employeeId);
  return { ok: true as const };
}

export async function syncEmployeeToolAction(input: {
  employeeId: string;
  toolDefinitionId: string;
  isEnabled: boolean;
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageEmployees",
  );

  await syncEmployeeTool({
    organizationId: workspace.organization.id,
    ...input,
  });

  revalidateBlueprintPaths(input.employeeId);
  return { ok: true as const };
}

export async function updateEmployeeSkillMetaAction(input: {
  employeeId: string;
  skillId: string;
  proficiency: SkillProficiency;
  priority: number;
  isActive: boolean;
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageEmployees",
  );

  await assignEmployeeSkills({
    organizationId: workspace.organization.id,
    employeeId: input.employeeId,
    assignments: [
      {
        skillId: input.skillId,
        proficiency: input.proficiency,
        priority: input.priority,
        isActive: input.isActive,
      },
    ],
  });

  revalidateBlueprintPaths(input.employeeId);
  return { ok: true as const };
}

export async function setOrganizationToolActiveAction(input: {
  toolDefinitionId: string;
  isActive: boolean;
}) {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageOrganization",
  );

  await setOrganizationToolActive({
    organizationId: workspace.organization.id,
    ...input,
  });

  revalidateBlueprintPaths();
  return { ok: true as const };
}

export async function listCharacterPresetsForStudioAction() {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageEmployees",
  );
  const { listOrganizationCharacterPresets } = await import(
    "../queries/list-organization-character-presets"
  );
  const presets = await listOrganizationCharacterPresets(workspace.organization.id);
  return presets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    slug: preset.slug,
    description: preset.description,
  }));
}

export type WorkforceAvatarPresetId = "somnia" | "kaira" | "megan" | "lili";

export type StudioAvatarPresetDefinition = {
  id: WorkforceAvatarPresetId;
  name: string;
  role: string;
  anamAvatarIdEnv: string;
  anamDisplayNameHint: string;
};

export type StudioAvatarPreset = {
  id: WorkforceAvatarPresetId;
  name: string;
  description: string;
  imageUrl: string | null;
};

export const WORKFORCE_AVATAR_PRESETS: StudioAvatarPresetDefinition[] = [
  {
    id: "somnia",
    name: "Somnia",
    role: "Enterprise Sales Employee",
    anamAvatarIdEnv: "ANAM_PRESET_SOMNIA_AVATAR_ID",
    anamDisplayNameHint: "somnia",
  },
  {
    id: "kaira",
    name: "Kaira",
    role: "Customer Support Employee",
    anamAvatarIdEnv: "ANAM_PRESET_KAIRA_AVATAR_ID",
    anamDisplayNameHint: "kaira",
  },
  {
    id: "megan",
    name: "Megan",
    role: "Legal Operations Employee",
    anamAvatarIdEnv: "ANAM_PRESET_MEGAN_AVATAR_ID",
    anamDisplayNameHint: "megan",
  },
  {
    id: "lili",
    name: "Lili",
    role: "Data Analyst Employee",
    anamAvatarIdEnv: "ANAM_PRESET_LILI_AVATAR_ID",
    anamDisplayNameHint: "lili",
  },
];

export const FREE_TIER_PRESET_COUNT = WORKFORCE_AVATAR_PRESETS.length;

export function isWorkforceAvatarPresetId(
  id: string,
): id is WorkforceAvatarPresetId {
  return WORKFORCE_AVATAR_PRESETS.some((preset) => preset.id === id);
}

export function getWorkforceAvatarPresetDefinition(
  id: WorkforceAvatarPresetId,
): StudioAvatarPresetDefinition {
  const preset = WORKFORCE_AVATAR_PRESETS.find((entry) => entry.id === id);
  if (!preset) {
    throw new Error(`Unknown workforce avatar preset: ${id}`);
  }
  return preset;
}

export function toStudioAvatarPreset(
  definition: StudioAvatarPresetDefinition,
  imageUrl: string | null,
): StudioAvatarPreset {
  return {
    id: definition.id,
    name: definition.name,
    description: definition.role,
    imageUrl,
  };
}

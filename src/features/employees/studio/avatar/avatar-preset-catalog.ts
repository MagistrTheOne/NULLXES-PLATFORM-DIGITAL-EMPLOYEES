export type StudioAvatarPreset = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

export const STUDIO_AVATAR_PRESET_CATALOG: StudioAvatarPreset[] = [
  {
    id: "preset-executive",
    name: "Executive",
    description: "Formal leadership presence for enterprise conversations.",
    imageUrl: "",
  },
  {
    id: "preset-sales",
    name: "Sales",
    description: "Confident and approachable for revenue-facing roles.",
    imageUrl: "",
  },
  {
    id: "preset-support",
    name: "Support",
    description: "Warm and attentive for customer-facing operations.",
    imageUrl: "",
  },
  {
    id: "preset-legal",
    name: "Legal",
    description: "Composed and precise for compliance workflows.",
    imageUrl: "",
  },
  {
    id: "preset-analyst",
    name: "Analyst",
    description: "Focused and neutral for data and research tasks.",
    imageUrl: "",
  },
  {
    id: "preset-engineer",
    name: "Engineer",
    description: "Technical and direct for automation and ops.",
    imageUrl: "",
  },
];

export function isStudioAvatarPresetId(id: string): boolean {
  return STUDIO_AVATAR_PRESET_CATALOG.some((preset) => preset.id === id);
}

export function getStudioAvatarPresetById(
  id: string,
): StudioAvatarPreset | undefined {
  return STUDIO_AVATAR_PRESET_CATALOG.find((preset) => preset.id === id);
}

export function normalizeStudioVoiceGender(value?: string): string {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized.includes("female") || normalized === "f") {
    return "Female";
  }

  if (normalized.includes("male") || normalized === "m") {
    return "Male";
  }

  return "Neutral";
}

export type StudioVoiceGenderFilter = "all" | "female" | "male";

export function matchesStudioVoiceGenderFilter(
  gender: string,
  filter: StudioVoiceGenderFilter,
): boolean {
  if (filter === "all") {
    return true;
  }

  const normalized = gender.trim().toLowerCase();

  if (filter === "female") {
    return normalized.includes("female");
  }

  return normalized.includes("male");
}

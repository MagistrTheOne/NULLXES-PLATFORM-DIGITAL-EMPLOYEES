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
  const isFemale =
    normalized === "f" ||
    normalized === "female" ||
    normalized.includes("female");
  const isMale =
    !isFemale &&
    (normalized === "m" ||
      normalized === "male" ||
      normalized.includes("male"));

  if (filter === "female") {
    return isFemale;
  }

  return isMale;
}

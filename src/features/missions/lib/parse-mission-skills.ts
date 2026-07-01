export function parseMissionSkills(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return [
    ...new Set(
      raw
        .split(/[,;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function formatMissionSkills(skills: string[] | null | undefined): string {
  if (!skills?.length) {
    return "";
  }

  return skills.join(", ");
}

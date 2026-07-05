export type MissionType =
  | "prospecting"
  | "prospecting_en"
  | "investor_base"
  | "custom";

export const QUALIFIED_MISSION_TYPES = new Set<MissionType>([
  "prospecting",
  "prospecting_en",
  "investor_base",
]);

export function isQualifiedMissionType(type: MissionType): boolean {
  return QUALIFIED_MISSION_TYPES.has(type);
}

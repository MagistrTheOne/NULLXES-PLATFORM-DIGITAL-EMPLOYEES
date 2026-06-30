import type { MissionTimelineStep } from "@/entities/employee-mission";

export function appendMissionTimelineStep(
  timeline: MissionTimelineStep[],
  step: Omit<MissionTimelineStep, "at">,
): MissionTimelineStep[] {
  return [
    ...timeline,
    {
      ...step,
      at: new Date().toISOString(),
    },
  ];
}

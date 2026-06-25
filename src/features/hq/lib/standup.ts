import type { HqEmployee } from "../types";

/** Center of the atrium standup ring (kept clear of every room footprint). */
export const MEETING_POINT: [number, number] = [0, 0.5];
const RING_RADIUS = 1.8;

/** Standup cadence (seconds): a short gathering once per period. */
const PERIOD_SECONDS = 240;
const DURATION_SECONDS = 30;

/** Only gather when there is a real "team" present, and cap the ring size. */
const MIN_PARTICIPANTS = 3;
const MAX_PARTICIPANTS = 6;

/**
 * Deterministically decide who is standing where during a standup, purely from
 * wall-clock time so every figure agrees on the ring without any messaging.
 * Returns an empty map outside the gathering window or when too few employees
 * are available (offline / on a floor errand are excluded).
 */
export function computeStandup(
  employees: HqEmployee[],
  nowSeconds: number,
): Map<string, [number, number]> {
  const result = new Map<string, [number, number]>();

  const phase = nowSeconds % PERIOD_SECONDS;
  if (phase > DURATION_SECONDS) {
    return result;
  }

  const eligible = employees
    .filter(
      (employee) => employee.runtimeStatus !== "offline" && employee.task === null,
    )
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, MAX_PARTICIPANTS);

  if (eligible.length < MIN_PARTICIPANTS) {
    return result;
  }

  const [cx, cz] = MEETING_POINT;
  eligible.forEach((employee, index) => {
    const angle = (index / eligible.length) * Math.PI * 2;
    result.set(employee.id, [
      cx + Math.cos(angle) * RING_RADIUS,
      cz + Math.sin(angle) * RING_RADIUS,
    ]);
  });

  return result;
}

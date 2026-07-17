import type { HqEmployee } from "../types";
import {
  CHARACTER_RADIUS,
  OPS_TABLE_HALF_D,
  OPS_TABLE_POINT,
} from "./office-layout";

/**
 * Standup ring around the Operations Table (outside its collider).
 * Kept clear of desk AABBs so grid paths can reach every slot.
 */
export const MEETING_POINT: [number, number] = [
  OPS_TABLE_POINT[0],
  OPS_TABLE_POINT[1],
];
const RING_RADIUS = OPS_TABLE_HALF_D + CHARACTER_RADIUS + 0.55;

/** Standup cadence (seconds): a short gathering once per period. */
const PERIOD_SECONDS = 240;
const DURATION_SECONDS = 45;

/** Only gather when there is a real "team" present, and cap the ring size. */
const MIN_PARTICIPANTS = 3;
const MAX_PARTICIPANTS = 6;

export function isStandupWindow(nowSeconds: number): boolean {
  return nowSeconds % PERIOD_SECONDS <= DURATION_SECONDS;
}

/**
 * Deterministically decide who is standing where during a standup, purely from
 * wall-clock time so every figure agrees on the ring without any messaging.
 * Returns an empty map outside the gathering window or when too few employees
 * are available (offline / on a floor errand / awaiting approval are excluded).
 */
export function computeStandup(
  employees: HqEmployee[],
  nowSeconds: number,
): Map<string, [number, number]> {
  const result = new Map<string, [number, number]>();

  if (!isStandupWindow(nowSeconds)) {
    return result;
  }

  const eligible = employees
    .filter((employee) => {
      if (employee.runtimeStatus === "offline") return false;
      if (employee.task !== null) return false;
      // Don't pull agents off ops-table approval walks.
      if (employee.mission?.stage === "awaiting_approval") return false;
      return true;
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, MAX_PARTICIPANTS);

  if (eligible.length < MIN_PARTICIPANTS) {
    return result;
  }

  const [cx, cz] = MEETING_POINT;
  eligible.forEach((employee, index) => {
    const angle = (index / eligible.length) * Math.PI * 2 - Math.PI / 2;
    result.set(employee.id, [
      cx + Math.cos(angle) * RING_RADIUS,
      cz + Math.sin(angle) * RING_RADIUS,
    ]);
  });

  return result;
}

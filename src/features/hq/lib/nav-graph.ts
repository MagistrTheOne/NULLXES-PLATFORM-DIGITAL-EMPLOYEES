import { OFFICE_ROOMS } from "./office-layout";
import type { HqDepartment } from "../types";

export type NavPoint = [number, number];

/**
 * Atrium-facing "door" of each room — the midpoint of the open side that leads
 * into the central atrium. Employees route through these instead of clipping
 * through the outer walls. Derived from each room's footprint + wall config.
 */
export const ROOM_DOORS: Record<HqDepartment, NavPoint> = {
  // open south
  sales: [OFFICE_ROOMS.sales.x, OFFICE_ROOMS.sales.z + OFFICE_ROOMS.sales.d / 2],
  // open south
  support: [
    OFFICE_ROOMS.support.x,
    OFFICE_ROOMS.support.z + OFFICE_ROOMS.support.d / 2,
  ],
  // open west
  hr: [OFFICE_ROOMS.hr.x - OFFICE_ROOMS.hr.w / 2, OFFICE_ROOMS.hr.z],
  // open north
  analytics: [
    OFFICE_ROOMS.analytics.x,
    OFFICE_ROOMS.analytics.z - OFFICE_ROOMS.analytics.d / 2,
  ],
  // open north
  executive: [
    OFFICE_ROOMS.executive.x,
    OFFICE_ROOMS.executive.z - OFFICE_ROOMS.executive.d / 2,
  ],
  // open east
  reception: [
    OFFICE_ROOMS.reception.x + OFFICE_ROOMS.reception.w / 2,
    OFFICE_ROOMS.reception.z,
  ],
};

/** Central atrium hub every door connects to (a simple, wall-free star graph). */
export const ATRIUM_HUB: NavPoint = [0, 0.5];

/**
 * Build an invisible polyline from the employee's home room to a destination
 * room: exit through the home door, cross the atrium hub, enter the target
 * door, then reach the target point. Same-room trips skip the atrium.
 */
export function buildErrandPath(
  fromDepartment: HqDepartment,
  toDepartment: HqDepartment,
  target: NavPoint,
): NavPoint[] {
  if (fromDepartment === toDepartment) {
    return [target];
  }
  return [
    ROOM_DOORS[fromDepartment],
    ATRIUM_HUB,
    ROOM_DOORS[toDepartment],
    target,
  ];
}

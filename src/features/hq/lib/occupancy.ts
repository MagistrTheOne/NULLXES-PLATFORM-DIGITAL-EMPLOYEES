import {
  listAllSeatAnchors,
  snapToNearestFreeSeat,
} from "./office-layout";

const OCCUPY_EPS = 0.45;

/**
 * Greedy exclusive seat assignment: each employee gets a unique seat anchor.
 * Prefer their layout seat when free; otherwise nearest free anchor.
 */
export function resolveExclusiveHomes(
  assignments: Array<{ id: string; preferred: [number, number] }>,
): Record<string, [number, number]> {
  const taken: Array<[number, number]> = [];
  const out: Record<string, [number, number]> = {};

  for (const row of assignments) {
    const seat = snapToNearestFreeSeat(
      row.preferred[0],
      row.preferred[1],
      taken,
    );
    out[row.id] = seat;
    taken.push(seat);
  }

  return out;
}

/** True when two world points claim the same seat. */
export function seatsOverlap(
  a: [number, number],
  b: [number, number],
  radius = OCCUPY_EPS,
): boolean {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) < radius;
}

/** Live XZ positions for soft separation (imperative, R3F-safe). */
const livePositions = new Map<string, [number, number]>();

export function publishLivePosition(
  id: string,
  x: number,
  z: number,
): void {
  livePositions.set(id, [x, z]);
}

export function clearLivePosition(id: string): void {
  livePositions.delete(id);
}

/**
 * Soft push away from other bodies. Does not replace furniture collision.
 */
export function separateFromOthers(
  id: string,
  x: number,
  z: number,
  radius = 0.5,
): [number, number] {
  let ox = x;
  let oz = z;
  for (const [otherId, pos] of livePositions) {
    if (otherId === id) continue;
    const dx = ox - pos[0];
    const dz = oz - pos[1];
    const dist = Math.hypot(dx, dz);
    if (dist > 1e-4 && dist < radius) {
      const push = (radius - dist) * 0.4;
      ox += (dx / dist) * push;
      oz += (dz / dist) * push;
    }
  }
  return [ox, oz];
}

/** Debug / tests: how many seat anchors exist on the floor. */
export function seatAnchorCount(): number {
  return listAllSeatAnchors().length;
}

import type { HqDepartment, HqRuntimeStatus } from "../types";

export type RoomWalls = {
  north?: boolean;
  south?: boolean;
  east?: boolean;
  west?: boolean;
};

export type RoomDef = {
  department: HqDepartment;
  /** Center on the floor plane. */
  x: number;
  z: number;
  /** Footprint width (X) and depth (Z). */
  w: number;
  d: number;
  walls: RoomWalls;
};

/**
 * Open-plan headquarters footprint. Rooms open toward the central atrium;
 * only the outer-facing walls are drawn so the floor reads like the mockup.
 */
export const OFFICE_ROOMS: Record<HqDepartment, RoomDef> = {
  sales: {
    department: "sales",
    x: -5,
    z: -6.5,
    w: 9,
    d: 6,
    walls: { north: true, west: true },
  },
  support: {
    department: "support",
    x: 5.5,
    z: -6.5,
    w: 9,
    d: 6,
    walls: { north: true, east: true },
  },
  hr: {
    department: "hr",
    x: 11.5,
    z: 1,
    w: 5,
    d: 6,
    walls: { north: true, east: true },
  },
  analytics: {
    department: "analytics",
    x: -5,
    z: 7,
    w: 9,
    d: 6,
    walls: { south: true, west: true },
  },
  executive: {
    department: "executive",
    x: 5.5,
    z: 7,
    w: 9,
    d: 6,
    walls: { south: true, east: true },
  },
  reception: {
    department: "reception",
    x: -12.5,
    z: 0.5,
    w: 4.5,
    d: 7,
    walls: { north: true, south: true, west: true },
  },
};

export const STATUS_COLORS: Record<HqRuntimeStatus, string> = {
  active: "#34d399",
  busy: "#fbbf24",
  idle: "#9ca3af",
  offline: "#f87171",
};

export const FLOOR_HALF = 22;
export const WALL_HEIGHT = 1.5;
export const WALL_THICKNESS = 0.16;

/**
 * Place N employees on a tidy grid inside a room footprint, biased toward the
 * open (atrium-facing) half so they read as "at their desks".
 */
export function placeEmployeesInRoom(
  room: RoomDef,
  count: number,
): Array<[number, number]> {
  if (count <= 0) {
    return [];
  }

  const columns = Math.min(count, 3);
  const rows = Math.ceil(count / columns);
  const padX = room.w * 0.26;
  const padZ = room.d * 0.26;
  const usableW = room.w - padX * 2;
  const usableD = room.d - padZ * 2;

  const positions: Array<[number, number]> = [];
  for (let index = 0; index < count; index += 1) {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const fx = columns === 1 ? 0.5 : col / (columns - 1);
    const fz = rows === 1 ? 0.5 : row / (rows - 1);
    const x = room.x - usableW / 2 + fx * usableW;
    const z = room.z - usableD / 2 + fz * usableD;
    positions.push([x, z]);
  }

  return positions;
}

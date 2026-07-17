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
/** Central Operations Table footprint (XZ). */
export const OPS_TABLE_POINT: [number, number] = [0, 0.2];
export const OPS_TABLE_HALF_W = 2.15;
export const OPS_TABLE_HALF_D = 2.15;

/**
 * Desk mesh footprint (RoundedBox 1.15 × 0.68 in office-room Desk).
 * Collider + seat offset derive from these — single source of truth.
 */
export const DESK_SIZE_X = 1.15;
export const DESK_SIZE_Z = 0.68;
export const DESK_HALF_W = DESK_SIZE_X / 2;
export const DESK_HALF_D = DESK_SIZE_Z / 2;

/** Character collision radius used for seats / push-out / nav. */
export const CHARACTER_RADIUS = 0.28;

/**
 * Stand point just outside the ops table collider (atrium / +Z side).
 * Never path to OPS_TABLE_POINT center — that is inside the obstacle.
 */
export const OPS_APPROACH: [number, number] = [
  OPS_TABLE_POINT[0],
  OPS_TABLE_POINT[1] + OPS_TABLE_HALF_D + CHARACTER_RADIUS + 0.2,
];

/**
 * Seat sits on the atrium-facing (+Z) side of the desk, clear of the desk AABB.
 * halfD + radius + small margin.
 */
export const DESK_CHAIR_OFFSET_Z = DESK_HALF_D + CHARACTER_RADIUS + 0.1;

/** Simple axis-aligned box obstacle for collision (center + half extents on XZ). */
export type Obstacle = {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
};

/**
 * One desk workstation: visual center, collider, chair seat, face yaw.
 * Mesh, spawn, and collision all read from this.
 */
export type DeskSlot = {
  id: string;
  department: HqDepartment;
  desk: [number, number];
  seat: [number, number];
  /** Yaw so the employee faces the desk (atan2 dx, dz). */
  faceYaw: number;
  obstacle: Obstacle;
};

/** Build desk slots for a room (desk + seat + collider, in sync). */
export function getDeskSlots(room: RoomDef): DeskSlot[] {
  const count = Math.min(4, Math.max(1, Math.round((room.w * room.d) / 18)));
  const spread = room.w * 0.52;
  const deskZ = room.z - room.d * 0.16;

  return Array.from({ length: count }, (_, index) => {
    const fx = count === 1 ? 0.5 : index / (count - 1);
    const deskX = count === 1 ? room.x : room.x - spread / 2 + fx * spread;
    const desk: [number, number] = [deskX, deskZ];
    const seat: [number, number] = [deskX, deskZ + DESK_CHAIR_OFFSET_Z];
    // Face toward desk (negative Z from seat).
    const faceYaw = Math.atan2(desk[0] - seat[0], desk[1] - seat[1]);
    return {
      id: `${room.department}-desk-${index}`,
      department: room.department,
      desk,
      seat,
      faceYaw,
      obstacle: {
        x: deskX,
        z: deskZ,
        halfW: DESK_HALF_W,
        halfD: DESK_HALF_D,
      },
    };
  });
}

/** Standing overflow anchors behind the desk row (still clear of desk AABBs). */
export function getStandingSlots(
  room: RoomDef,
  count: number,
): Array<{ id: string; seat: [number, number]; faceYaw: number }> {
  if (count <= 0) return [];
  const columns = Math.min(count, 3);
  const padX = room.w * 0.28;
  const usableW = room.w - padX * 2;
  const baseZ = room.z + room.d * 0.18;
  const faceYaw = Math.atan2(0, -1); // face toward desk row (−Z)

  return Array.from({ length: count }, (_, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const fx = columns === 1 ? 0.5 : col / (columns - 1);
    const seat: [number, number] = [
      room.x - usableW / 2 + fx * usableW,
      baseZ + row * 0.85,
    ];
    return {
      id: `${room.department}-stand-${index}`,
      seat,
      faceYaw,
    };
  });
}

/** All chair seats + a few standing anchors per room (for drag snap). */
export function listAllSeatAnchors(): Array<[number, number]> {
  const seats: Array<[number, number]> = [];
  for (const room of Object.values(OFFICE_ROOMS)) {
    for (const slot of getDeskSlots(room)) {
      seats.push(slot.seat);
    }
    for (const stand of getStandingSlots(room, 3)) {
      seats.push(stand.seat);
    }
  }
  return seats;
}

const SEAT_OCCUPY_RADIUS = 0.45;

/** Face yaw for the nearest desk/standing seat to a world point. */
export function faceYawNearSeat(x: number, z: number): number {
  let bestYaw = Math.atan2(0, -1);
  let bestD = Infinity;
  for (const room of Object.values(OFFICE_ROOMS)) {
    for (const slot of getDeskSlots(room)) {
      const d = Math.hypot(slot.seat[0] - x, slot.seat[1] - z);
      if (d < bestD) {
        bestD = d;
        bestYaw = slot.faceYaw;
      }
    }
    for (const stand of getStandingSlots(room, 3)) {
      const d = Math.hypot(stand.seat[0] - x, stand.seat[1] - z);
      if (d < bestD) {
        bestD = d;
        bestYaw = stand.faceYaw;
      }
    }
  }
  return bestYaw;
}

/**
 * Snap a drop point to the nearest free seat/standing anchor.
 * `taken` = positions already claimed by other employees.
 */
export function snapToNearestFreeSeat(
  x: number,
  z: number,
  taken: Array<[number, number]> = [],
): [number, number] {
  const anchors = listAllSeatAnchors();
  const isTaken = (sx: number, sz: number) =>
    taken.some(
      ([tx, tz]) => Math.hypot(tx - sx, tz - sz) < SEAT_OCCUPY_RADIUS,
    );

  let best: [number, number] | null = null;
  let bestD = Infinity;
  for (const [sx, sz] of anchors) {
    if (isTaken(sx, sz)) continue;
    const d = Math.hypot(sx - x, sz - z);
    if (d < bestD) {
      bestD = d;
      best = [sx, sz];
    }
  }

  if (best) return best;

  // All seats full — push out of furniture near the drop.
  return resolvePlacement(x, z, getStaticObstacles(), CHARACTER_RADIUS);
}

/**
 * Build static collision obstacles from the current room layout + furniture.
 * Desk obstacles come from DeskSlot (same footprint as the mesh).
 */
export function getStaticObstacles(): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const wallHalf = WALL_THICKNESS / 2;

  for (const room of Object.values(OFFICE_ROOMS)) {
    const halfW = room.w / 2;
    const halfD = room.d / 2;

    if (room.walls.north) {
      obstacles.push({
        x: room.x,
        z: room.z - halfD,
        halfW,
        halfD: wallHalf,
      });
    }
    if (room.walls.south) {
      obstacles.push({
        x: room.x,
        z: room.z + halfD,
        halfW,
        halfD: wallHalf,
      });
    }
    if (room.walls.west) {
      obstacles.push({
        x: room.x - halfW,
        z: room.z,
        halfW: wallHalf,
        halfD,
      });
    }
    if (room.walls.east) {
      obstacles.push({
        x: room.x + halfW,
        z: room.z,
        halfW: wallHalf,
        halfD,
      });
    }

    for (const slot of getDeskSlots(room)) {
      obstacles.push(slot.obstacle);
    }
  }

  obstacles.push({
    x: OPS_TABLE_POINT[0],
    z: OPS_TABLE_POINT[1],
    halfW: OPS_TABLE_HALF_W,
    halfD: OPS_TABLE_HALF_D,
  });

  obstacles.push({ x: -1.8, z: -7.2, halfW: 0.95, halfD: 0.4 });

  return obstacles;
}

/**
 * Push a point out of any overlapping obstacles (nearest edge on X then Z).
 */
export function resolvePlacement(
  x: number,
  z: number,
  obstacles: Obstacle[],
  radius = CHARACTER_RADIUS,
): [number, number] {
  let cx = x;
  let cz = z;
  for (let pass = 0; pass < 4; pass += 1) {
    if (!intersectsAny(cx, cz, obstacles, radius)) {
      return [cx, cz];
    }
    cx = pushOutX(cx, cz, obstacles, radius);
    cz = pushOutZ(cx, cz, obstacles, radius);
  }
  return [cx, cz];
}

/**
 * Resolve a desired movement against a list of axis-aligned obstacles.
 */
export function resolveMovement(
  fromX: number,
  fromZ: number,
  desiredX: number,
  desiredZ: number,
  obstacles: Obstacle[],
  radius = 0.32,
): [number, number] {
  let x = fromX;
  let z = fromZ;

  const dx = desiredX - fromX;
  const dz = desiredZ - fromZ;
  const stepLen = Math.hypot(dx, dz);
  if (stepLen < 0.0001) {
    return resolvePlacement(x, z, obstacles, radius);
  }

  const nx = dx / stepLen;
  const nz = dz / stepLen;

  const tx = x + dx;
  const tz = z + dz;

  if (!intersectsAny(tx, tz, obstacles, radius)) {
    return [tx, tz];
  }

  const slideX = x + nx * stepLen;
  if (!intersectsAny(slideX, z, obstacles, radius)) {
    x = slideX;
  } else {
    x = pushOutX(x, z, obstacles, radius);
  }

  const slideZ = z + nz * stepLen;
  if (!intersectsAny(x, slideZ, obstacles, radius)) {
    z = slideZ;
  } else {
    z = pushOutZ(x, z, obstacles, radius);
  }

  return resolvePlacement(x, z, obstacles, radius);
}

function intersectsAny(
  x: number,
  z: number,
  obstacles: Obstacle[],
  r: number,
): boolean {
  for (const o of obstacles) {
    const minX = o.x - o.halfW - r;
    const maxX = o.x + o.halfW + r;
    const minZ = o.z - o.halfD - r;
    const maxZ = o.z + o.halfD + r;
    if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) return true;
  }
  return false;
}

function pushOutX(x: number, z: number, obstacles: Obstacle[], r: number): number {
  let best = x;
  for (const o of obstacles) {
    const left = o.x - o.halfW - r;
    const right = o.x + o.halfW + r;
    if (z >= o.z - o.halfD - r && z <= o.z + o.halfD + r) {
      if (x > o.x) best = Math.max(best, right);
      else best = Math.min(best, left);
    }
  }
  return best;
}

function pushOutZ(x: number, z: number, obstacles: Obstacle[], r: number): number {
  let best = z;
  for (const o of obstacles) {
    const top = o.z - o.halfD - r;
    const bot = o.z + o.halfD + r;
    if (x >= o.x - o.halfW - r && x <= o.x + o.halfW + r) {
      if (z > o.z) best = Math.max(best, bot);
      else best = Math.min(best, top);
    }
  }
  return best;
}

/**
 * Desk centers for visuals (same as DeskSlot.desk).
 */
export function getDeskPositions(room: RoomDef): Array<[number, number]> {
  return getDeskSlots(room).map((slot) => slot.desk);
}

export type PlacedSeat = {
  position: [number, number];
  faceYaw: number;
  slotId: string;
};

/**
 * Place N employees on desk seats, then standing overflow.
 * Seats are authored clear of desk colliders — no push-out needed.
 */
export function placeEmployeesInRoom(
  room: RoomDef,
  count: number,
): Array<[number, number]> {
  return placeEmployeeSeatsInRoom(room, count).map((s) => s.position);
}

/** Same as placeEmployeesInRoom but includes faceYaw / slotId. */
export function placeEmployeeSeatsInRoom(
  room: RoomDef,
  count: number,
): PlacedSeat[] {
  if (count <= 0) return [];

  const deskSlots = getDeskSlots(room);
  const seats: PlacedSeat[] = deskSlots.map((slot) => ({
    position: slot.seat,
    faceYaw: slot.faceYaw,
    slotId: slot.id,
  }));

  if (count <= seats.length) {
    return seats.slice(0, count);
  }

  const overflow = count - seats.length;
  const standing = getStandingSlots(room, overflow);
  return [
    ...seats,
    ...standing.map((s) => ({
      position: s.seat,
      faceYaw: s.faceYaw,
      slotId: s.id,
    })),
  ];
}

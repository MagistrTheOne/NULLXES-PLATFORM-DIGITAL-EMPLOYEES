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

/** Simple axis-aligned box obstacle for collision (center + half extents on XZ). */
export type Obstacle = {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
};

/**
 * Build static collision obstacles from the current room layout + furniture.
 * Walls are thin boxes on the outer sides. Desks are small rectangles.
 * This is intentionally conservative so characters don't clip geometry.
 */
export function getStaticObstacles(): Obstacle[] {
  const obstacles: Obstacle[] = [];

  // Room walls (thin colliders)
  for (const room of Object.values(OFFICE_ROOMS)) {
    const halfW = room.w / 2;
    const halfD = room.d / 2;

    if (room.walls.north) {
      obstacles.push({ x: room.x, z: room.z - halfD, halfW, halfD: WALL_THICKNESS / 2 + 0.05 });
    }
    if (room.walls.south) {
      obstacles.push({ x: room.x, z: room.z + halfD, halfW, halfD: WALL_THICKNESS / 2 + 0.05 });
    }
    if (room.walls.west) {
      obstacles.push({ x: room.x - halfW, z: room.z, halfW: WALL_THICKNESS / 2 + 0.05, halfD });
    }
    if (room.walls.east) {
      obstacles.push({ x: room.x + halfW, z: room.z, halfW: WALL_THICKNESS / 2 + 0.05, halfD });
    }
  }

  // Desks (approximate footprint of the Desk component)
  // Desk is roughly 1.1 x 0.62 on the floor.
  const deskHalfW = 0.58;
  const deskHalfD = 0.35;

  for (const room of Object.values(OFFICE_ROOMS)) {
    const deskPos = getDeskPositions(room);
    for (const [dx, dz] of deskPos) {
      obstacles.push({ x: dx, z: dz, halfW: deskHalfW, halfD: deskHalfD });
    }
  }

  // Central Operations Table
  obstacles.push({
    x: OPS_TABLE_POINT[0],
    z: OPS_TABLE_POINT[1],
    halfW: OPS_TABLE_HALF_W,
    halfD: OPS_TABLE_HALF_D,
  });

  // Coffee station counter (near the back of atrium)
  obstacles.push({ x: -1.8, z: -7.2, halfW: 0.95, halfD: 0.4 });

  return obstacles;
}

/**
 * Resolve a desired movement against a list of axis-aligned obstacles.
 * Simple "slide" resolution: move as far as possible on X then Z (or vice-versa).
 * radius = character collision radius (approx 0.28-0.35 for low-poly figures).
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
  if (stepLen < 0.0001) return [x, z];

  // Normalize direction
  const nx = dx / stepLen;
  const nz = dz / stepLen;

  // Try full step first
  let tx = x + dx;
  let tz = z + dz;

  if (!intersectsAny(tx, tz, obstacles, radius)) {
    return [tx, tz];
  }

  // Slide on X
  const slideX = x + nx * stepLen;
  if (!intersectsAny(slideX, z, obstacles, radius)) {
    x = slideX;
  } else {
    // push out on X
    x = pushOutX(x, z, obstacles, radius);
  }

  // Slide on Z from the new X
  const slideZ = z + nz * stepLen;
  if (!intersectsAny(x, slideZ, obstacles, radius)) {
    z = slideZ;
  } else {
    z = pushOutZ(x, z, obstacles, radius);
  }

  // Final clamp against all
  return [clampAgainst(x, z, obstacles, radius)[0], clampAgainst(x, z, obstacles, radius)[1]];
}

function intersectsAny(x: number, z: number, obstacles: Obstacle[], r: number): boolean {
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

function clampAgainst(x: number, z: number, obstacles: Obstacle[], r: number): [number, number] {
  let cx = x;
  let cz = z;
  for (const o of obstacles) {
    const minX = o.x - o.halfW - r;
    const maxX = o.x + o.halfW + r;
    const minZ = o.z - o.halfD - r;
    const maxZ = o.z + o.halfD + r;
    cx = Math.max(minX, Math.min(maxX, cx));
    cz = Math.max(minZ, Math.min(maxZ, cz));
  }
  return [cx, cz];
}

/**
 * Returns desk center positions inside a room (same logic used for visuals).
 * Kept here so collision obstacles stay perfectly in sync with rendered desks.
 */
export function getDeskPositions(room: RoomDef): Array<[number, number]> {
  // Allow a bit more furniture in larger rooms for a fuller map feel
  const count = Math.min(4, Math.max(1, Math.round((room.w * room.d) / 18)));
  const spread = room.w * 0.52;
  const z = room.z - room.d * 0.16;
  if (count === 1) {
    return [[room.x, z]];
  }
  return Array.from({ length: count }, (_, index) => {
    const fx = count === 1 ? 0.5 : index / (count - 1);
    return [room.x - spread / 2 + fx * spread, z] as [number, number];
  });
}

// Backwards-compatible alias for internal use
const deskPositions = getDeskPositions;

/**
 * Place N employees on chair-side seats in front of desks (not on desk
 * colliders — sitting on the desk AABB caused walk↔push oscillation).
 */
export function placeEmployeesInRoom(
  room: RoomDef,
  count: number,
): Array<[number, number]> {
  if (count <= 0) {
    return [];
  }

  const desks = getDeskPositions(room);
  /** Chair sits on the atrium-facing side of the desk. */
  const CHAIR_OFFSET_Z = 0.62;
  const seats = desks.map(([x, z]) => [x, z + CHAIR_OFFSET_Z] as [number, number]);

  if (count <= seats.length) {
    return seats.slice(0, count);
  }

  // Overflow: tidy grid behind the desk row, still clear of desk AABBs.
  const extras: Array<[number, number]> = [];
  const overflow = count - seats.length;
  const columns = Math.min(overflow, 3);
  const padX = room.w * 0.28;
  const usableW = room.w - padX * 2;
  const baseZ = room.z + room.d * 0.18;
  for (let index = 0; index < overflow; index += 1) {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const fx = columns === 1 ? 0.5 : col / (columns - 1);
    extras.push([
      room.x - usableW / 2 + fx * usableW,
      baseZ + row * 0.85,
    ]);
  }

  return [...seats, ...extras];
}

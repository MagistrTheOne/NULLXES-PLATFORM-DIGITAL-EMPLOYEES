import {
  CHARACTER_RADIUS,
  FLOOR_HALF,
  getStaticObstacles,
  type Obstacle,
} from "./office-layout";
import type { NavPoint } from "./nav-graph";

/** Grid cell size in world units (~0.45m). */
const CELL = 0.45;
const BOUND = FLOOR_HALF - 1.5;
const ORIGIN = -BOUND;
const GRID_SPAN = BOUND * 2;
const COLS = Math.ceil(GRID_SPAN / CELL);
const ROWS = Math.ceil(GRID_SPAN / CELL);

type Cell = { c: number; r: number };

let walkableCache: Uint8Array | null = null;

function worldToCell(x: number, z: number): Cell {
  const c = Math.max(0, Math.min(COLS - 1, Math.floor((x - ORIGIN) / CELL)));
  const r = Math.max(0, Math.min(ROWS - 1, Math.floor((z - ORIGIN) / CELL)));
  return { c, r };
}

function cellToWorld(c: number, r: number): NavPoint {
  return [ORIGIN + (c + 0.5) * CELL, ORIGIN + (r + 0.5) * CELL];
}

function cellIndex(c: number, r: number): number {
  return r * COLS + c;
}

function cellBlocked(
  cx: number,
  cz: number,
  obstacles: Obstacle[],
  radius: number,
): boolean {
  for (const o of obstacles) {
    const minX = o.x - o.halfW - radius;
    const maxX = o.x + o.halfW + radius;
    const minZ = o.z - o.halfD - radius;
    const maxZ = o.z + o.halfD + radius;
    if (cx >= minX && cx <= maxX && cz >= minZ && cz <= maxZ) {
      return true;
    }
  }
  return false;
}

function ensureWalkable(): Uint8Array {
  if (walkableCache) return walkableCache;
  const obstacles = getStaticObstacles();
  const grid = new Uint8Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const [x, z] = cellToWorld(c, r);
      // Slightly tighter than CHARACTER_RADIUS so seats near desks stay walkable.
      grid[cellIndex(c, r)] = cellBlocked(x, z, obstacles, CHARACTER_RADIUS * 0.92)
        ? 0
        : 1;
    }
  }
  walkableCache = grid;
  return grid;
}

/** Invalidate cache if layout constants change at runtime (tests / hot reload). */
export function invalidateNavGrid(): void {
  walkableCache = null;
}

function heuristic(a: Cell, b: Cell): number {
  const dc = Math.abs(a.c - b.c);
  const dr = Math.abs(a.r - b.r);
  // Octile distance
  return Math.max(dc, dr) + (Math.SQRT2 - 1) * Math.min(dc, dr);
}

function nearestWalkable(x: number, z: number, maxRing = 6): Cell | null {
  const grid = ensureWalkable();
  const start = worldToCell(x, z);
  if (grid[cellIndex(start.c, start.r)]) return start;

  for (let ring = 1; ring <= maxRing; ring += 1) {
    for (let dc = -ring; dc <= ring; dc += 1) {
      for (let dr = -ring; dr <= ring; dr += 1) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
        const c = start.c + dc;
        const r = start.r + dr;
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
        if (grid[cellIndex(c, r)]) return { c, r };
      }
    }
  }
  return null;
}

const NEIGHBORS: Array<[number, number, number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/**
 * A* on the office walkable grid. Returns world waypoints (cell centers),
 * or null if no path.
 */
export function findGridPath(from: NavPoint, to: NavPoint): NavPoint[] | null {
  const grid = ensureWalkable();
  const start = nearestWalkable(from[0], from[1]);
  const goal = nearestWalkable(to[0], to[1]);
  if (!start || !goal) return null;

  if (start.c === goal.c && start.r === goal.r) {
    return [to];
  }

  const total = COLS * ROWS;
  const gScore = new Float32Array(total);
  gScore.fill(Infinity);
  const fScore = new Float32Array(total);
  fScore.fill(Infinity);
  const cameFrom = new Int32Array(total);
  cameFrom.fill(-1);
  const closed = new Uint8Array(total);

  const startIdx = cellIndex(start.c, start.r);
  gScore[startIdx] = 0;
  fScore[startIdx] = heuristic(start, goal);

  // Simple open list (fine for ~8k cells)
  const open: number[] = [startIdx];

  while (open.length > 0) {
    let bestI = 0;
    let bestF = fScore[open[0]!];
    for (let i = 1; i < open.length; i += 1) {
      const f = fScore[open[i]!];
      if (f < bestF) {
        bestF = f;
        bestI = i;
      }
    }
    const current = open[bestI]!;
    open[bestI] = open[open.length - 1]!;
    open.pop();

    if (closed[current]) continue;
    closed[current] = 1;

    const cc = current % COLS;
    const cr = (current / COLS) | 0;
    if (cc === goal.c && cr === goal.r) {
      const cells: Cell[] = [{ c: cc, r: cr }];
      let cur = current;
      while (cameFrom[cur] >= 0) {
        cur = cameFrom[cur]!;
        cells.push({ c: cur % COLS, r: (cur / COLS) | 0 });
      }
      cells.reverse();
      const path = cells.map((cell) => cellToWorld(cell.c, cell.r));
      // Snap ends to exact request points when walkable-adjacent
      if (path.length > 0) {
        path[0] = from;
        path[path.length - 1] = to;
      }
      return simplifyPath(path);
    }

    for (const [dc, dr, cost] of NEIGHBORS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      // No corner-cutting through blocked diagonals
      if (dc !== 0 && dr !== 0) {
        if (!grid[cellIndex(cc + dc, cr)] || !grid[cellIndex(cc, cr + dr)]) {
          continue;
        }
      }
      const nIdx = cellIndex(nc, nr);
      if (!grid[nIdx] || closed[nIdx]) continue;
      const tentative = gScore[current]! + cost;
      if (tentative >= gScore[nIdx]!) continue;
      cameFrom[nIdx] = current;
      gScore[nIdx] = tentative;
      fScore[nIdx] = tentative + heuristic({ c: nc, r: nr }, goal);
      open.push(nIdx);
    }
  }

  return null;
}

function lineClear(a: NavPoint, b: NavPoint): boolean {
  const obstacles = getStaticObstacles();
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const steps = Math.max(2, Math.ceil(dist / (CELL * 0.5)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[1] + (b[1] - a[1]) * t;
    if (cellBlocked(x, z, obstacles, CHARACTER_RADIUS * 0.85)) {
      return false;
    }
  }
  return true;
}

/** String-pull: drop intermediate points when the shortcut is clear. */
function simplifyPath(path: NavPoint[]): NavPoint[] {
  if (path.length <= 2) return path;
  const out: NavPoint[] = [path[0]!];
  let i = 0;
  while (i < path.length - 1) {
    let j = path.length - 1;
    while (j > i + 1 && !lineClear(path[i]!, path[j]!)) {
      j -= 1;
    }
    out.push(path[j]!);
    i = j;
  }
  return out;
}

/**
 * Connect skeleton waypoints (door → hub → target) with grid A* segments
 * so agents don't cut through desks/walls.
 */
export function stitchWaypointPath(waypoints: NavPoint[]): NavPoint[] {
  if (waypoints.length === 0) return [];
  if (waypoints.length === 1) return waypoints;

  const result: NavPoint[] = [];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const a = waypoints[i]!;
    const b = waypoints[i + 1]!;
    const segment = findGridPath(a, b);
    if (!segment || segment.length === 0) {
      if (result.length === 0 || result[result.length - 1] !== a) {
        result.push(a);
      }
      result.push(b);
      continue;
    }
    for (let k = 0; k < segment.length; k += 1) {
      const p = segment[k]!;
      const last = result[result.length - 1];
      if (
        last &&
        Math.hypot(last[0] - p[0], last[1] - p[1]) < 0.05
      ) {
        continue;
      }
      result.push(p);
    }
  }
  return result;
}

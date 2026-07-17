import type { HqDepartment } from "../types";
import type { AgentOfficeState } from "./agent-office-state";
import {
  ATRIUM_HUB,
  ROOM_DOORS,
  buildErrandPath,
  type NavPoint,
} from "./nav-graph";
import { stitchWaypointPath } from "./nav-grid";
import { OFFICE_ROOMS, OPS_APPROACH } from "./office-layout";

/**
 * HQ Nav Controller (deterministic locomotion).
 *
 * Skeleton waypoints (door → atrium → target) are expanded via walkable-grid
 * A* so agents do not cut through desks or walls.
 */
export function buildOfficeNavPath(input: {
  fromDepartment: HqDepartment;
  officeState: AgentOfficeState;
  deskCoords: NavPoint;
  errandDestination?: HqDepartment | null;
  errandTarget?: NavPoint | null;
}): NavPoint[] | null {
  const {
    fromDepartment,
    officeState,
    deskCoords,
    errandDestination,
    errandTarget,
  } = input;

  let skeleton: NavPoint[] | null = null;

  if (errandDestination && errandTarget) {
    skeleton = buildErrandPath(fromDepartment, errandDestination, errandTarget);
  } else if (officeState.zone === "ops_table" || officeState.action === "review") {
    skeleton = [ROOM_DOORS[fromDepartment], ATRIUM_HUB, OPS_APPROACH];
  } else if (officeState.action === "handoff") {
    const destDept = zoneToDepartment(officeState.zone) ?? fromDepartment;
    const room = OFFICE_ROOMS[destDept];
    skeleton = buildErrandPath(fromDepartment, destDept, [room.x, room.z]);
  }

  if (!skeleton || skeleton.length === 0) {
    return null;
  }

  return stitchWaypointPath([deskCoords, ...skeleton]);
}

export function pathSignature(path: NavPoint[] | null | undefined): string {
  if (!path || path.length === 0) {
    return "";
  }
  return path.map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`).join("|");
}

function zoneToDepartment(
  zone: AgentOfficeState["zone"],
): HqDepartment | null {
  switch (zone) {
    case "sales":
    case "support":
    case "hr":
    case "executive":
    case "reception":
      return zone;
    case "operations":
      return "analytics";
    case "ops_table":
      return null;
    default:
      return null;
  }
}

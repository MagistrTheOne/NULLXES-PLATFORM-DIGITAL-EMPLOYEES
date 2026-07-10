import type { HqDepartment } from "../types";
import type { AgentOfficeState } from "./agent-office-state";
import { ATRIUM_HUB, ROOM_DOORS, buildErrandPath, type NavPoint } from "./nav-graph";
import { OFFICE_ROOMS, OPS_TABLE_POINT } from "./office-layout";

/**
 * HQ Nav Controller (deterministic locomotion).
 *
 * Only issues a path when the agent must relocate for a real platform reason.
 * Idle / desk work never gets a "walk home" path — that fought desk colliders
 * and looked like walk↔return loops.
 */
export function buildOfficeNavPath(input: {
  fromDepartment: HqDepartment;
  officeState: AgentOfficeState;
  deskCoords: NavPoint;
  errandDestination?: HqDepartment | null;
  errandTarget?: NavPoint | null;
}): NavPoint[] | null {
  const { fromDepartment, officeState, errandDestination, errandTarget } = input;

  if (errandDestination && errandTarget) {
    return buildErrandPath(fromDepartment, errandDestination, errandTarget);
  }

  if (officeState.zone === "ops_table" || officeState.action === "review") {
    return [ROOM_DOORS[fromDepartment], ATRIUM_HUB, OPS_TABLE_POINT];
  }

  if (officeState.action === "handoff") {
    const destDept = zoneToDepartment(officeState.zone) ?? fromDepartment;
    const room = OFFICE_ROOMS[destDept];
    return buildErrandPath(fromDepartment, destDept, [room.x, room.z]);
  }

  // monitor / call / research / draft / blocked — stay put at seat
  return null;
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

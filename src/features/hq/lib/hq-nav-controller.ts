import type { HqDepartment } from "../types";
import type { AgentOfficeState } from "./agent-office-state";
import { ATRIUM_HUB, ROOM_DOORS, buildErrandPath, type NavPoint } from "./nav-graph";
import { OFFICE_ROOMS, OPS_TABLE_POINT } from "./office-layout";

/**
 * HQ Nav Controller (deterministic locomotion).
 *
 * LLM / platform truth → AgentOfficeState → this module → polyline on the
 * invisible nav graph. The renderer only interpolates along the path.
 * No wander / coffee / vision carnival.
 */
export function buildOfficeNavPath(input: {
  fromDepartment: HqDepartment;
  officeState: AgentOfficeState;
  deskCoords: NavPoint;
  /** Active floor errand destination, if any. */
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

  if (errandDestination && errandTarget) {
    return buildErrandPath(fromDepartment, errandDestination, errandTarget);
  }

  if (officeState.zone === "ops_table" || officeState.action === "review") {
    return [
      ROOM_DOORS[fromDepartment],
      ATRIUM_HUB,
      OPS_TABLE_POINT,
    ];
  }

  if (officeState.action === "handoff") {
    const destDept = zoneToDepartment(officeState.zone) ?? fromDepartment;
    const room = OFFICE_ROOMS[destDept];
    return buildErrandPath(fromDepartment, destDept, [room.x, room.z]);
  }

  // Idle / working / talking / blocked — stay at (or return to) desk.
  // Same-room path is a single point so the agent walks home if displaced.
  if (
    Math.hypot(
      officeState.targetCoords[0] - deskCoords[0],
      officeState.targetCoords[1] - deskCoords[1],
    ) > 0.35
  ) {
    return buildErrandPath(
      fromDepartment,
      fromDepartment,
      officeState.targetCoords,
    );
  }

  return null;
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

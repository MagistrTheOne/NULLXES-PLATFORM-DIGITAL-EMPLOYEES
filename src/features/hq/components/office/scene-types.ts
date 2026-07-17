import type { RoomDef } from "../../lib/office-layout";
import type { AgentOfficeState } from "../../lib/agent-office-state";
import type { HqBehaviorPlan } from "../../lib/hq-behavior-types";
import type { HqRuntimeStatus } from "../../types";

/**
 * Presentation-ready employee for the 3D scene. All i18n strings are resolved
 * outside the <Canvas> boundary (React context does not cross into R3F).
 */
export type SceneEmployee = {
  id: string;
  name: string;
  taskLabel: string | null;
  status: HqRuntimeStatus;
  /** Desk/seat anchor (where the employee settles). */
  position: [number, number];
  /** Face desk when idle at seat (from DeskSlot). */
  seatYaw: number;
  /** Interior bounds the employee roams within (keeps them inside the room). */
  roam: { minX: number; maxX: number; minZ: number; maxZ: number };
  /**
   * Legacy motion bucket (compat). Prefer `officeState` + `plan`.
   *  - "desk"  anchored at seat — talk / type / queue / idle monitor
   *  - "lofi"  unused for idle (kept for compat)
   *  - "roam"  path walk (floor errand / ops table)
   *  - "still" offline — frozen at desk
   */
  behavior: "roam" | "lofi" | "still" | "desk";
  /** Semantic simulation plan from HQBehaviorPlanner. */
  plan: HqBehaviorPlan;
  /** Deterministic office contract: status + zone + action → motion. */
  officeState: AgentOfficeState;
  /** Operational label for the nameplate (not used for speech bubbles). */
  speechText: string | null;
  /** LLM-generated speech lines for bubbles (drag + idle). Empty = quiet. */
  thoughts: string[];
  /** GLB character model, or null to use the procedural figure. */
  modelUrl: string | null;
  /**
   * Active floor errand: when set, the employee walks to `target` (a room
   * center) and lingers there until the task clears, overriding roaming.
   */
  task: {
    label: string;
    target: [number, number];
    /** Invisible waypoint route (home door → atrium → destination door → target). */
    path: [number, number][];
  } | null;
  /** Atrium ring slot during a standup, or null when not gathering. */
  meetingTarget: [number, number] | null;
  /** Localized standup badge label (e.g. "Standup"). */
  meetingLabel: string;
  /** Soft desk highlight when working. */
  deskHighlight: boolean;
  /** Soft audio pulse when talking. */
  audioPulse: boolean;
  /** Red desk marker when blocked. */
  blocked: boolean;
  /** Equipped loadout presence (text/badge until cosmetics assets land). */
  hasLoadout: boolean;
};

export type SceneRoom = {
  def: RoomDef;
  label: string;
  occupied: number;
  capacity: number;
};

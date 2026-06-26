import type { RoomDef } from "../../lib/office-layout";
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
  /** Interior bounds the employee roams within (keeps them inside the room). */
  roam: { minX: number; maxX: number; minZ: number; maxZ: number };
  /**
   * Legacy motion bucket (compat). Prefer `plan.movement` + `plan.animation`.
   *  - "desk"  anchored at seat — talk / type / queue
   *  - "lofi"  idle wander within room
   *  - "roam"  path walk (floor errand)
   *  - "still" offline — frozen at desk
   */
  behavior: "roam" | "lofi" | "still" | "desk";
  /** Semantic simulation plan from HQBehaviorPlanner. */
  plan: HqBehaviorPlan;
  /** Real focus text for speech bubbles (overrides lofi when set). */
  speechText: string | null;
  /** Curated lofi thought lines (resolved i18n) shown periodically in a bubble. */
  thoughts: string[];
  /** NULLXES/kavka-style one-liners shown when the user grabs/drops the figure. */
  reactions: string[];
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
};

export type SceneRoom = {
  def: RoomDef;
  label: string;
};

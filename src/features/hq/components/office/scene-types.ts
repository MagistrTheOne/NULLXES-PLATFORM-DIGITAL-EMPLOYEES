import type { RoomDef } from "../../lib/office-layout";
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
   * Ambient behavior:
   *  - "roam"  active/busy: moves around often
   *  - "lofi"  idle: mostly at desk, occasional wander / coffee / a thought
   *  - "still" offline: frozen at the desk
   */
  behavior: "roam" | "lofi" | "still";
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
};

export type SceneRoom = {
  def: RoomDef;
  label: string;
};

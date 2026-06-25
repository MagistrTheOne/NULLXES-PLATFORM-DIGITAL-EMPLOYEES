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
  position: [number, number];
};

export type SceneRoom = {
  def: RoomDef;
  label: string;
};

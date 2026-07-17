"use client";

import { create } from "zustand";
import {
  FLOOR_HALF,
  snapToNearestFreeSeat,
} from "../lib/office-layout";

const SCENE_BOUND = FLOOR_HALF - 1.5;

function clampToScene(value: number): number {
  return Math.max(-SCENE_BOUND, Math.min(SCENE_BOUND, value));
}

type OfficeStore = {
  selectedEmployeeId: string | null;
  hoveredEmployeeId: string | null;
  /** Employee currently being dragged with the mouse, or null. */
  draggingId: string | null;
  /** Live world position [x, z] under the pointer during a drag. */
  dragTarget: [number, number] | null;
  /**
   * Manual placements made by dragging. Client-only and keyed by employee id,
   * so they survive realtime polls within the session (reset on full reload).
   * An override becomes the employee's new "home" desk on the floor.
   */
  overrides: Record<string, [number, number]>;
  /**
   * Default home seats from layout (updated by canvas). Used with overrides
   * for occupancy when snapping drag drops.
   */
  homeSeats: Record<string, [number, number]>;
  /** Employee whose inline office chat overlay is open, or null. */
  talkEmployeeId: string | null;
  selectEmployee: (id: string | null) => void;
  hoverEmployee: (id: string | null) => void;
  beginDrag: (id: string) => void;
  updateDragTarget: (pos: [number, number]) => void;
  endDrag: () => void;
  setHomeSeats: (homes: Record<string, [number, number]>) => void;
  openTalk: (id: string) => void;
  closeTalk: () => void;
};

export const useOfficeStore = create<OfficeStore>((set) => ({
  selectedEmployeeId: null,
  hoveredEmployeeId: null,
  draggingId: null,
  dragTarget: null,
  overrides: {},
  homeSeats: {},
  talkEmployeeId: null,
  selectEmployee: (id) => set({ selectedEmployeeId: id }),
  hoverEmployee: (id) => set({ hoveredEmployeeId: id }),
  beginDrag: (id) =>
    set({ draggingId: id, dragTarget: null, selectedEmployeeId: id }),
  updateDragTarget: (pos) => set({ dragTarget: pos }),
  setHomeSeats: (homes) => set({ homeSeats: homes }),
  endDrag: () =>
    set((state) => {
      if (!state.draggingId || !state.dragTarget) {
        return { draggingId: null, dragTarget: null };
      }
      const [rawX, rawZ] = state.dragTarget;
      const taken: Array<[number, number]> = [];
      const ids = new Set([
        ...Object.keys(state.homeSeats),
        ...Object.keys(state.overrides),
      ]);
      for (const id of ids) {
        if (id === state.draggingId) continue;
        const pos = state.overrides[id] ?? state.homeSeats[id];
        if (pos) taken.push(pos);
      }
      const [sx, sz] = snapToNearestFreeSeat(
        clampToScene(rawX),
        clampToScene(rawZ),
        taken,
      );
      return {
        draggingId: null,
        dragTarget: null,
        overrides: {
          ...state.overrides,
          [state.draggingId]: [clampToScene(sx), clampToScene(sz)],
        },
      };
    }),
  openTalk: (id) => set({ talkEmployeeId: id, selectedEmployeeId: id }),
  closeTalk: () => set({ talkEmployeeId: null }),
}));

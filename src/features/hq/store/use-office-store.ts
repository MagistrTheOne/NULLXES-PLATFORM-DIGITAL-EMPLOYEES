"use client";

import { create } from "zustand";

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
  /** Employee whose inline office chat overlay is open, or null. */
  talkEmployeeId: string | null;
  selectEmployee: (id: string | null) => void;
  hoverEmployee: (id: string | null) => void;
  beginDrag: (id: string) => void;
  updateDragTarget: (pos: [number, number]) => void;
  endDrag: () => void;
  openTalk: (id: string) => void;
  closeTalk: () => void;
};

export const useOfficeStore = create<OfficeStore>((set) => ({
  selectedEmployeeId: null,
  hoveredEmployeeId: null,
  draggingId: null,
  dragTarget: null,
  overrides: {},
  talkEmployeeId: null,
  selectEmployee: (id) => set({ selectedEmployeeId: id }),
  hoverEmployee: (id) => set({ hoveredEmployeeId: id }),
  beginDrag: (id) =>
    set({ draggingId: id, dragTarget: null, selectedEmployeeId: id }),
  updateDragTarget: (pos) => set({ dragTarget: pos }),
  endDrag: () =>
    set((state) => {
      if (!state.draggingId || !state.dragTarget) {
        return { draggingId: null, dragTarget: null };
      }
      return {
        draggingId: null,
        dragTarget: null,
        overrides: {
          ...state.overrides,
          [state.draggingId]: state.dragTarget,
        },
      };
    }),
  openTalk: (id) => set({ talkEmployeeId: id, selectedEmployeeId: id }),
  closeTalk: () => set({ talkEmployeeId: null }),
}));

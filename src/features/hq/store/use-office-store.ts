"use client";

import { create } from "zustand";

type OfficeStore = {
  selectedEmployeeId: string | null;
  hoveredEmployeeId: string | null;
  selectEmployee: (id: string | null) => void;
  hoverEmployee: (id: string | null) => void;
};

export const useOfficeStore = create<OfficeStore>((set) => ({
  selectedEmployeeId: null,
  hoveredEmployeeId: null,
  selectEmployee: (id) => set({ selectedEmployeeId: id }),
  hoverEmployee: (id) => set({ hoveredEmployeeId: id }),
}));

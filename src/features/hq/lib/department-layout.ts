import { HQ_DEPARTMENTS, type HqDepartment } from "../types";

/**
 * Floor anchor for each department, expressed on an abstract grid.
 * `x`/`z` are world coordinates for the (future) isometric scene; the same
 * ordering drives the Directory layout so both views stay consistent.
 */
export type DepartmentAnchor = {
  department: HqDepartment;
  x: number;
  z: number;
};

export const DEPARTMENT_ANCHORS: Record<HqDepartment, DepartmentAnchor> = {
  reception: { department: "reception", x: 0, z: 6 },
  sales: { department: "sales", x: -6, z: 0 },
  support: { department: "support", x: 6, z: 0 },
  hr: { department: "hr", x: -6, z: -6 },
  analytics: { department: "analytics", x: 6, z: -6 },
  executive: { department: "executive", x: 0, z: -10 },
};

export const DEPARTMENT_ORDER: readonly HqDepartment[] = HQ_DEPARTMENTS;

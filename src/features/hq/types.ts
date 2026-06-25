import type {
  BrainProvider,
  EmployeeStatus,
} from "@/entities/digital-employee";
import type { ProviderProvisioningStatus } from "@/entities/provider-config";

export const HQ_DEPARTMENTS = [
  "reception",
  "sales",
  "support",
  "hr",
  "analytics",
  "executive",
] as const;

export type HqDepartment = (typeof HQ_DEPARTMENTS)[number];

export type HqActivityKind = "idle" | "in_session" | "working" | "queued";

/** Live presence used by the floor legend (Active / Busy / Idle / Offline). */
export type HqRuntimeStatus = "active" | "busy" | "idle" | "offline";

/**
 * Badge floating over an employee. Either a literal `text` (a real task title)
 * or a localizable `key` against `hq.activity.*` (with optional ICU `count`).
 */
export type HqActivityBadge = {
  key?: string;
  text?: string;
  count?: number;
};

export type HqActivity = {
  kind: HqActivityKind;
  badge: HqActivityBadge | null;
};

export type HqEmployee = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  runtimeStatus: HqRuntimeStatus;
  brainProvider: BrainProvider;
  avatarPreviewUrl: string | null;
  avatarProvisioningStatus: ProviderProvisioningStatus;
  department: HqDepartment;
  activity: HqActivity;
  sessionsInRange: number;
  lastSessionAt: Date | null;
  tasksToday: number;
  createdAt: Date;
  isLive: boolean;
  canTalk: boolean;
};

export type HqDepartmentGroup = {
  department: HqDepartment;
  employees: HqEmployee[];
};

export type HqDepartmentMetrics = {
  department: HqDepartment;
  total: number;
  active: number;
  live: number;
  /** 0-100 utilization: active headcount over total headcount. */
  utilization: number;
};

export type HqState = {
  employees: HqEmployee[];
  departments: HqDepartmentGroup[];
  departmentMetrics: HqDepartmentMetrics[];
  liveCount: number;
};

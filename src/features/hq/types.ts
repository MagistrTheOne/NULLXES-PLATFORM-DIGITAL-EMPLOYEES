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

/**
 * An in-flight floor errand (e.g. issued from chat: "go to CRM"). Drives the
 * employee to physically walk to a destination room until it completes.
 */
export type HqActiveTask = {
  destination: HqDepartment;
  label: string;
};

export type HqMissionStage =
  | "research"
  | "draft"
  | "awaiting_approval"
  | "sent";

/** Optional mission context attached to an HQ employee for Inspector / motion. */
export type HqEmployeeMission = {
  missionId: string;
  title: string;
  status: string;
  stage: HqMissionStage | null;
  lastAction: string | null;
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
  /** Active floor errand the employee is walking, or null when at the desk. */
  task: HqActiveTask | null;
  sessionsInRange: number;
  /** Total conversation time across sessions in range, in seconds. */
  conversationSeconds: number;
  /** Mean satisfaction (1-5) over rated sessions in range, or null. */
  satisfactionAvg: number | null;
  lastSessionAt: Date | null;
  tasksToday: number;
  createdAt: Date;
  isLive: boolean;
  canTalk: boolean;
  /** Active mission snapshot for Inspector + office state, if any. */
  mission: HqEmployeeMission | null;
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
  /** Session volume handled by the department within the range. */
  sessions: number;
  /** Total conversation time across the department, in seconds. */
  conversationSeconds: number;
  /** Mean satisfaction (1-5) over rated sessions, or null when unrated. */
  satisfactionAvg: number | null;
};

export type HqOpsItemKind = "approval" | "escalation" | "handoff" | "mission";

export type HqOpsItem = {
  id: string;
  kind: HqOpsItemKind;
  title: string;
  subtitle?: string;
  employeeId?: string;
  missionId?: string;
  at: string;
};

export type HqTimelineEvent = {
  id: string;
  missionId: string;
  employeeId: string;
  employeeName: string;
  key: string;
  label: string;
  at: string;
  missionTitle: string;
};

export type HqState = {
  employees: HqEmployee[];
  departments: HqDepartmentGroup[];
  departmentMetrics: HqDepartmentMetrics[];
  liveCount: number;
  /** Cards for the Central Operations Table. */
  opsItems: HqOpsItem[];
  /** Last 3–5 mission timeline events for the floor journal. */
  recentTimeline: HqTimelineEvent[];
};

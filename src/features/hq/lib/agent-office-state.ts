import type { HqDepartment, HqEmployee } from "../types";
import type { HqActivitySignals } from "./hq-behavior-types";
import {
  OFFICE_ROOMS,
  OPS_TABLE_POINT,
  placeEmployeesInRoom,
} from "./office-layout";

export type AgentOfficeStatus =
  | "idle"
  | "working"
  | "talking"
  | "awaiting_approval"
  | "blocked";

export type AgentOfficeZone =
  | "sales"
  | "support"
  | "hr"
  | "operations"
  | "executive"
  | "reception"
  | "ops_table";

export type AgentOfficeAction =
  | "research"
  | "call"
  | "draft"
  | "handoff"
  | "review"
  | "monitor";

/**
 * Structured office state — LLM / platform truth compresses here.
 * The 3D client maps this deterministically to coords + animation + label.
 */
export type AgentOfficeState = {
  agentId: string;
  status: AgentOfficeStatus;
  zone: AgentOfficeZone;
  action: AgentOfficeAction;
  taskId?: string;
  label?: string;
  updatedAt: string;
  /** World XZ target the renderer walks toward. */
  targetCoords: [number, number];
};

export type HqMissionHint = {
  missionId: string;
  title: string;
  status: string;
  stage: "research" | "draft" | "awaiting_approval" | "sent" | null;
  lastAction: string | null;
};

function departmentToZone(department: HqDepartment): AgentOfficeZone {
  if (department === "analytics") {
    return "operations";
  }
  return department;
}

function deskCoords(
  department: HqDepartment,
  seatIndex: number,
  seatCount: number,
): [number, number] {
  const room = OFFICE_ROOMS[department];
  const seats = placeEmployeesInRoom(room, Math.max(seatCount, 1));
  return seats[Math.min(seatIndex, seats.length - 1)] ?? [room.x, room.z];
}

function inferWorkingAction(label: string | null): AgentOfficeAction {
  if (!label) {
    return "draft";
  }
  const lower = label.toLowerCase();
  if (
    lower.includes("research") ||
    lower.includes("account") ||
    lower.includes("prospect") ||
    lower.includes("web")
  ) {
    return "research";
  }
  if (lower.includes("draft") || lower.includes("writ") || lower.includes("propos")) {
    return "draft";
  }
  return "draft";
}

/**
 * Compress platform signals into AgentOfficeState.
 * Does not invent wander / coffee / carnival motion.
 */
export function resolveAgentOfficeState(input: {
  employee: Pick<
    HqEmployee,
    "id" | "department" | "status" | "isLive" | "activity" | "task" | "runtimeStatus"
  >;
  signals: HqActivitySignals;
  seatIndex: number;
  seatCount: number;
  missionHint?: HqMissionHint | null;
  taskBadgeLabel?: string | null;
}): AgentOfficeState {
  const { employee, signals, seatIndex, seatCount, missionHint, taskBadgeLabel } =
    input;
  const zone = departmentToZone(employee.department);
  const desk = deskCoords(employee.department, seatIndex, seatCount);
  const updatedAt = new Date().toISOString();
  const focus = signals.focusText ?? taskBadgeLabel ?? missionHint?.title ?? undefined;

  if (employee.status !== "active" || signals.trigger === "offline") {
    return {
      agentId: employee.id,
      status: "idle",
      zone,
      action: "monitor",
      label: "Offline",
      updatedAt,
      targetCoords: desk,
    };
  }

  if (missionHint?.status === "failed") {
    return {
      agentId: employee.id,
      status: "blocked",
      zone,
      action: "monitor",
      taskId: missionHint.missionId,
      label: missionHint.lastAction ?? "Blocked",
      updatedAt,
      targetCoords: desk,
    };
  }

  if (
    missionHint?.status === "waiting_approval" ||
    missionHint?.stage === "awaiting_approval"
  ) {
    return {
      agentId: employee.id,
      status: "awaiting_approval",
      zone: "ops_table",
      action: "review",
      taskId: missionHint.missionId,
      label: focus ?? "Awaiting approval",
      updatedAt,
      targetCoords: OPS_TABLE_POINT,
    };
  }

  if (signals.trigger === "floor_errand" && employee.task) {
    const destRoom = OFFICE_ROOMS[employee.task.destination];
    return {
      agentId: employee.id,
      status: "working",
      zone: departmentToZone(employee.task.destination),
      action: "handoff",
      label: employee.task.label,
      updatedAt,
      targetCoords: [destRoom.x, destRoom.z],
    };
  }

  if (signals.trigger === "live_session") {
    return {
      agentId: employee.id,
      status: "talking",
      zone,
      action: "call",
      label: taskBadgeLabel ?? "In conversation",
      updatedAt,
      targetCoords: desk,
    };
  }

  if (signals.trigger === "task_in_progress") {
    const action = inferWorkingAction(focus ?? null);
    return {
      agentId: employee.id,
      status: "working",
      zone,
      action,
      label: focus ?? "Working",
      updatedAt,
      targetCoords: desk,
    };
  }

  if (signals.trigger === "task_queued") {
    return {
      agentId: employee.id,
      status: "working",
      zone,
      action: "monitor",
      label: focus ?? "Queued",
      updatedAt,
      targetCoords: desk,
    };
  }

  if (missionHint?.status === "working") {
    const action =
      missionHint.stage === "research"
        ? "research"
        : missionHint.stage === "draft"
          ? "draft"
          : "draft";
    return {
      agentId: employee.id,
      status: "working",
      zone,
      action,
      taskId: missionHint.missionId,
      label: missionHint.lastAction ?? missionHint.title,
      updatedAt,
      targetCoords: desk,
    };
  }

  return {
    agentId: employee.id,
    status: "idle",
    zone,
    action: "monitor",
    label: "Idle / Monitoring",
    updatedAt,
    targetCoords: desk,
  };
}

import type { EmployeeStatus } from "@/entities/digital-employee";
import type { HqTaskSnapshot } from "../queries/get-employee-task-snapshots";
import type {
  HqActiveTask,
  HqActivity,
  HqActivityKind,
  HqRuntimeStatus,
} from "../types";
import type { HqActivitySignals, HqActivityTrigger } from "./hq-behavior-types";

type ActivityInput = {
  isLive: boolean;
  status: EmployeeStatus;
  tasks: HqTaskSnapshot;
};

/** Map runtime signals onto the floor legend status. */
export function deriveRuntimeStatus(input: ActivityInput): HqRuntimeStatus {
  if (input.status !== "active") {
    return "offline";
  }
  if (input.isLive) {
    return "busy";
  }
  if (input.tasks.inProgressCount > 0 || input.tasks.pendingCount > 0) {
    return "active";
  }
  return "idle";
}

/**
 * Derive the floating badge purely from real signals: live sessions and the
 * employee's actual task queue. The badge text for an in-progress task is the
 * real task title (e.g. "Interview", "Follow up").
 */
export function deriveEmployeeActivity(input: ActivityInput): HqActivity {
  if (input.status !== "active") {
    return { kind: "idle", badge: null };
  }

  if (input.isLive) {
    return { kind: "in_session", badge: { key: "inSession" } };
  }

  if (input.tasks.inProgressTitle) {
    return {
      kind: "working",
      badge: { text: input.tasks.inProgressTitle },
    };
  }

  if (input.tasks.pendingCount > 0) {
    return {
      kind: "queued",
      badge: { key: "queued", count: input.tasks.pendingCount },
    };
  }

  return { kind: "idle", badge: null };
}

type EmployeeSignalInput = {
  status: EmployeeStatus;
  isLive: boolean;
  activity: HqActivity;
  task: HqActiveTask | null;
};

/**
 * Decompress derived activity into planner triggers without collapsing semantics
 * early. Preserves `activity.kind` for badges while exposing why motion runs.
 */
export function deriveActivitySignals(
  input: EmployeeSignalInput,
): HqActivitySignals {
  if (input.status !== "active") {
    return { trigger: "offline", focusText: null };
  }

  if (input.task) {
    return {
      trigger: "floor_errand",
      focusText: input.task.label,
    };
  }

  if (input.isLive) {
    return { trigger: "live_session", focusText: null };
  }

  const kind: HqActivityKind = input.activity.kind;

  if (kind === "working") {
    return {
      trigger: "task_in_progress",
      focusText: input.activity.badge?.text ?? null,
    };
  }

  if (kind === "queued") {
    return {
      trigger: "task_queued",
      focusText: null,
    };
  }

  return { trigger: "idle", focusText: null };
}

export function resolveActivityTrigger(
  input: EmployeeSignalInput,
): HqActivityTrigger {
  return deriveActivitySignals(input).trigger;
}
